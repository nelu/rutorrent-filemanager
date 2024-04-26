<?php

namespace Flm;

use Exception;
use rTask;
use Utility;

class Archive
{

    public $file;
    public $options = [];
    protected $config = [];
    protected $workDir;


    public function __construct($archive_file, $config = [])
    {
        $this->file = $archive_file;
        $this->config = $config;
    }

    /**
     * @param $o
     * @return ShellCmd
     * @throws Exception
     */
    public function compressCmd($o): ShellCmd
    {

        // which wrapper to use P7zip or Rar according to configured bin
        $wrapper = ($this->getCompressBin($o->type))
            ->setFileList($o->fileList)
            ->setProgressIndicator(1);
        $wrapper->setCommand($wrapper::ARCHIVE_COMMAND);

        $newpass = clone $wrapper;

        $wrapper->setArchiveFile($o->archive)
            ->setVolumeSize($o->volumeSize > 0 ? $o->volumeSize : false)
            ->setPassword(isset($o->password) && strlen($o->password) > 0 ? $o->password : false)
            ->setCompression($o->compression ?? false);

        if (is_array($o->multiplePass) && !empty($o->multiplePass))
        {
            // pipe to specified binary
            $wrapper
                ->setArchiveType($o->multiplePass[1])
                ->setProgressIndicator(1)
                ->setReadFromStdin(true)
                ->setFileList(false)
                ->setStdOutput(false);

            $wrapper = $newpass->setArchiveType($o->multiplePass[0])
                ->setArchiveFile(' ')
                ->setProgressIndicator(2)
                ->setStdOutput(true)
                ->setArg('|', true)
                ->setArg($wrapper->cmd(), true);
        }

        return $wrapper;
    }

    public static function extractCmd($o)
    {
        return P7zip::unpack($o->file, $o->to)
            ->binary($o->binary)
            ->setPassword(isset($o->password) && strlen($o->password) > 0 ? $o->password : '')
            ->setProgressIndicator(1)
            ->cmd();
    }

    public function setOptions($options)
    {
        $aopts = $this->config['type'][$options['type']];
        $compression = $aopts['compression'][$options['compression']];

        $this->options = [
            'type' => $options['type'],
            'compression' => $compression,
            'password' => $options['password'],
            'volumeSize' => (int)$options['volumeSize'] * 1024,
            'multiplePass' => isset($aopts['multipass']) ? $aopts['multipass'] : []
        ];

        return $this;
    }

    /**
     * @param $files
     * @return array
     * @throws Exception
     */
    public function create($files)
    {
        if (empty($this->workDir))
        {
            throw new Exception("setWorkDir first", 1);
        }
        if (empty($this->options))
        {
            throw new Exception("setOptions first", 1);
        }

        $p = (object)array_merge($this->options,
            [
                'fileList' => "files.list",
                'files' => $files,
                'archive' => $this->file
            ]);

        $rtask = TaskController::from([
            'name' => 'archive',
            'arg' => count($files) . ' files in ' . basename($p->archive)
        ]);

        $p->fileList = ($rtask->writeFile)($p->fileList, implode("\n", $p->files) . "\n");

        $cmds = [
            'cd ' . Helper::mb_escapeshellarg($this->workDir),
            '{', self::compressCmd($p)->cmd(), '}',
        ];

        $ret = $rtask->start($cmds, rTask::FLG_DEFAULT);

        return $ret;
    }

    public function getCompressBin(string $type = ''): P7zip
    {
        if (empty($type))
        {
            $type = pathinfo($this->file, PATHINFO_EXTENSION);
        }

        $formatBin = isset($this->config['type'][$type]['bin']) ? $this->config['type'][$type]['bin'] : '7zip';

        $formatBin = Utility::getExternal($formatBin);

        return (
            isset($this->config['type'][$type]['wrapper'])
            && class_exists($this->config['type'][$type]['wrapper']))
            ? new $this->config['type'][$type]['wrapper']($formatBin)
            : (($formatBin == 'rar') ? new Rar($formatBin) : new P7zip($formatBin));
    }

    /**
     * @return string
     */
    public function getWorkDir(): string
    {
        return $this->workDir;
    }

    /**
     * @param string $workDir
     */
    public function setWorkDir($workDir)
    {
        $this->workDir = $workDir;
    }

    public function extract($path = null)
    {
        if (!is_null($path))
        {
            $this->setWorkDir($path);
        }

        $p = (object)array_merge($this->options, [
            'file' => $this->file,
            'to' => './',
            'binary' => Utility::getExternal('7zip'),
        ]);

        $cmds = [ShellCmds::mkdir($this->workDir, true)->cmd(),
            '{', 'cd ' . Helper::mb_escapeshellarg($this->workDir), '}',
        ];

        $cmds[] = self::extractCmd($p);

        return $cmds;
    }
}