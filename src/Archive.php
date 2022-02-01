<?php

namespace Flm;

use \Exception;
use rTask;
use Throwable;
use Utility;

class Archive
{

    static $rar = ['compress' => '',
        'extract' => ''];
    public $file;

    public $options = [];

    protected $workDir;

    protected $taskController;

    public function __construct($archive_file)
    {
        $this->file = $archive_file;
        $this->taskController = new TaskController();

    }

    public function setOptions($options)
    {

        $aopts = Helper::getConfig('archive');
        $aopts = $aopts['type'][$options['type']];

        $compression = $aopts['compression'][$options['compression']];

        $pass = '';
        if (isset($options['password']) && !empty($options['password'])
            && ( $options['type'] == 'rar' ||  $options['type'] == 'zip')
        ) {
            $pass = $options['password'];
        }

        $this->workDir = $options['workdir'];
        $this->options = [
            'work_dir' => $options['workdir'],
            'type' => $options['type'],
            'compression' => $compression,
            'password' => $pass,
            'volume_size' => (intval($options['volumeSize']) * 1024)
        ];

        return $this;
    }

    public function create($files)
    {

        if (empty($this->options)) {

            throw new Exception("Please load setOptions first", 1);
        }

        $p = (object)[
            'files' => array_map(function ($e) {return basename($e);}, $files),
            'archive' => $this->file,
            'options' => (object)$this->options,
            'binary' => ArchiveFormats::getBin($this->file, true)
        ];

        $task_opts = [
            'requester' => 'filemanager',
            'name' => 'compress',
            'arg' => count($p->files) . ' files in ' . $p->archive
        ];

        
        $rtask = new rTask($task_opts);
        $taskDir = $rtask->makeDirectory();
        $files_list = $taskDir.'/files.list';
        $p->filelist = $files_list;
        file_put_contents($files_list, implode("\n", $p->files)."\n");

        $cmds = [
            'cd ' . Helper::mb_escapeshellarg($this->workDir),
            '{', ArchiveFormats::getArchiveCompressCmd($p), '}',
        ];

        $ret = $rtask->start($cmds, rTask::FLG_DEFAULT);

        return $ret;
    }


    public function extract($to)
    {
        $params = (object)[
            'files' => [$this->file],
            'to' => $to,
            'binary' => ArchiveFormats::getBin()
        ];

        $task_opts = [
            'requester' => 'filemanager',
            'name' => 'unpack',
            'arg' => basename($this->file)
        ];

        try {
            $cmds = [

                implode(" ", ShellCmds::mkdir($to, true)),
                '{', 'cd ' . Helper::mb_escapeshellarg($to), '}',
            ];

            foreach ($params->files as $file) {
                $params->file = $file;
                $params->to = './';
                $cmds[] = ArchiveFormats::getArchiveExtractCmd($params);
            }

            $rtask = new rTask($task_opts);
            $ret = $rtask->start($cmds, 0);
        } catch (Throwable $err) {
            $ret = $err;
        }

        return $ret;

    }
}