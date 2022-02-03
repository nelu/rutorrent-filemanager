<?php

namespace Flm;

use \Exception;
use FileUtil;
use rTask;
use Utility;

class Archive
{

    static $rar = ['compress' => '',
        'extract' => ''];
    public $file;

    protected $config = [];

    public $options = [];

    protected $workDir;


    public function __construct($archive_file, $config = [])
    {
        $this->file = $archive_file;
        $this->config = $config;
    }

    public function setOptions($options)
    {
        $aopts = $this->config;
        $aopts = $aopts['type'][$options['type']];

        $compression = $aopts['compression'][$options['compression']];

        $pass = '';
        if (isset($options['password']) && !empty($options['password'])
            && ( $options['type'] == 'rar' ||  $options['type'] == 'zip')
        ) {
            $pass = $options['password'];
        }

        $this->options = [
            'type' => $options['type'],
            'compression' => $compression,
            'password' => $pass,
            'volume_size' => (intval($options['volumeSize']) * 1024)
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
        if (empty($this->workDir)) {
            throw new Exception("Please setWorkDir first", 1);

        }
        if (empty($this->options)) {
            throw new Exception("Please load setOptions first", 1);
        }

        $p = (object)[
            'files' => array_map(function ($e) {return basename($e);}, $files),
            'work_dir' => $this->workDir,
            'archive' => $this->file,
            'options' => (object)$this->options,
            'binary' => $this->getCompressBin()
        ];

        $task_opts = [
            'requester' => 'filemanager',
            'name' => 'compress',
            'arg' => count($p->files) . ' files in ' . $p->archive
        ];

        $rtask = TaskController::from($task_opts);
        $p->filelist = ($rtask->writeFile)("files.list", implode("\n", $p->files)."\n");

        $cmds = [
            'cd ' . Helper::mb_escapeshellarg($this->workDir),
            '{', ArchiveFormats::getArchiveCompressCmd($p), '}',
        ];

        $ret = $rtask->start($cmds, rTask::FLG_DEFAULT);

        return $ret;
    }

    /**
     * @return string
     */
    public function getWorkDir() : string
    {
        return $this->workDir;
    }

    /**
     * @param string $workDir
     */
    public function setWorkDir($workDir)
    {
        $this->workDir = FileUtil::addslash($workDir);
    }


    public function extract($path = null)
    {
        if(!is_null($path))
        {
            $this->setWorkDir($path);
        }

        $p = (object)[
            'to' => './',
            'binary' => Utility::getExternal('7zip')
        ];

        $task_opts = [
            'requester' => 'filemanager',
            'name' => 'unpack',
            'arg' => basename($this->file)
        ];


        $cmds = [
            implode(" ", ShellCmds::mkdir($this->workDir, true)),
            '{', 'cd ' . Helper::mb_escapeshellarg($this->workDir), '}',
        ];

        foreach ([$this->file] as $file) {
            $p->file = $file;
            $cmds[] = ArchiveFormats::extractCmd($p);
        }

        $rtask = new rTask($task_opts);
        return $rtask->start($cmds, rTask::FLG_DEFAULT);
    }

    public function getCompressBin($archive = '') {

        if(empty($archive))
        {
            $archive = $this->file;
        }
        $type = pathinfo($archive, PATHINFO_EXTENSION);

        $formatBin = isset($this->config['type'][$type]['bin']) ? $this->config['type'][$type]['bin'] : '7z';
        return Utility::getExternal($formatBin);
    }
}