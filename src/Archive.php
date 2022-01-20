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
    public $options;

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

        $a['type'] = $options['type'];
        $a['comp'] = $aopts['compression'][$options['compression']];
        $a['volume'] = (intval($options['volumeSize']) * 1024);
        $a['multif'] = (($a['type'] == 'rar') && (isset($options['format']) && $options['format'] == 'old')) ? '-vn' : '';

        $a['workdir'] = $options['workdir'];

        if (isset($options['password']) && !empty($options['password'])
            && ($a['type'] == 'rar' || $a['type'] == 'zip')
        ) {
            $a['password'] = $options['password'];
        }

        $this->options = $a;

        return $this;
    }

    public function create($files)
    {

        if (is_null($this->options)) {

            throw new Exception("Please load setOptions first", 1);
        }

        $temp = [];

        $args = [
            'action' => 'compressFiles',
            'params' => [
                'files' => array_map(function ($e) {
                    return basename($e);
                }, $files),
                'archive' => $this->file,
                'options' => $this->options,
                'binary' => $this->getBin($this->options)
            ]
        ];


        $this->taskController->info = json_decode(json_encode($args));
        $temp['tok'] = $this->taskController->run();


        return $temp;
    }

    public function getBin($compress = null)
    {

        if ($compress) {
            switch ($compress['type']) {

                case 'gzip':
                case 'tar':
                case 'bzip2':
                    $formatBin = 'tar';
                    break;
                case 'rar':
                    $formatBin = 'rar';
                    break;
                case 'zip':
                    $formatBin = 'zip';
                    break;
                default:
                    throw new Exception("Unsupported archive format " . $this->options['type'], 16);

            }
        } else {
            $formatBin = self::getExtractBinary($this->file);

        }

        if (!$formatBin) {
            throw new Exception("Error Processing Request", 18);
        }

        return Utility::getExternal($formatBin);

    }

    public static function getExtractBinary($file)
    {

        switch (pathinfo($file, PATHINFO_EXTENSION)) {
            case 'rar':
                $bin = 'rar';
                break;
            case 'zip':
                $bin = 'unzip';
                break;
            case 'iso':
                $bin = 'unzip';
                break;
            case 'tar':
            case 'bz2':
            case 'gz':
                $bin = 'tar';
                break;
            default:
                $bin = false;
        }

        return $bin;

    }

    public function extract($to)
    {
        $params = (object)[
            'files' => [$this->file],
            'to' => $to,
            'binary' => $this->getBin()
        ];

        $task_opts = [
            'requester' => 'filemanager',
            'name' => 'unpack',
            'arg' => basename($this->file)
        ];

        try {
            $cmds = [

                implode(" ", TaskController::mkdir($to, true)),
                '{', 'cd ' . Helper::mb_escapeshellarg($to), '}',
            ];

            foreach ($params->files as $file) {
                $params->file = $file;
                $params->to = './';
                $cmds[] = FsUtils::getArchiveExtractCmd($params);
            }

            $rtask = new rTask($task_opts);
            $ret = $rtask->start($cmds, 0);
        } catch (Throwable $err) {
            $ret = $err;
        }

        return $ret;

    }
}