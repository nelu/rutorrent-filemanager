<?php

namespace Flm;

use Exception;
use FileUtil;
use rTask;

class Filesystem
{
    protected $root;
    protected $name;

    /**
     * Filesystem constructor.
     * @param string $root
     * @param string $name
     */
    public function __construct($root, $name = 'filemanager')
    {
        $this->root = FileUtil::addslash($root);
        $this->name = $name;
    }

    /**
     * @param string $target
     * @param bool $recursive
     * @param null $mode
     * @return bool
     * @throws Exception
     */
    public function mkdir($target, $recursive = false, $mode = null)
    {
        if (self::isDir($target)) {
            throw new Exception($target, 16);
        }

        $args = TaskController::mkdir($this->rootPath($target), $recursive, $mode);

        if (!RemoteShell::get()->execOutput(array_shift($args), $args)) {
            throw new Exception("Error Processing Request", 4);
        }

        return true;
    }

    public function isDir($path) : bool
    {
        $path = $this->rootPath($path);

        return RemoteShell::test($path, 'd');
    }

    public function rootPath($relative_path = null) : string
    {
        if ($relative_path == null) {
            return $this->root;
        } else {
            return FileUtil::fullpath(trim($relative_path, '/'), $this->root);
        }
    }

    public function pathExists($path)
    {
        $path = $this->rootPath($path);
        return RemoteShell::test($path, 'e');
    }

    public function isFile($path)
    {
        $path = $this->rootPath($path);
        return RemoteShell::test($path, 'f');
    }

    public function copy($files, $to): array
    {
        $commands = [];
        $to = $this->rootPath($to);

        foreach ($files as $file) {
            $file = $this->rootPath($file);
            $commands[] = TaskController::recursiveCopy($file, $to);
        }

        $task_opts = ['requester' => $this->name,
            'name' => 'copy',
            'arg' => count($files) . ' files'
        ];

        $rtask = new rTask($task_opts);
        $ret = $rtask->start($commands, 0);

        return $ret;
    }

    public function move($files, $to): array
    {
        $commands = [];
        $to = $this->rootPath($to);

        foreach ($files as $file) {
            $file = $this->rootPath($file);
            $commands[] = TaskController::recursiveMove($file, $to);
        }

        $task_opts = [
            'requester' => $this->name,
            'name' => 'move',
            'arg' => count($files) . ' files'
        ];

        $rtask = new rTask($task_opts);
        $ret = $rtask->start($commands, 0);

        return $ret;

    }

    public function remove($files): array
    {
        $commands = [];

        foreach ($files as $file) {
            $commands[] = TaskController::recursiveRemove($this->rootPath($file));
        }

        $task_opts = [
            'requester' => $this->name,
            'name' => 'remove',
            'arg' => count($files) . ' files'
        ];

        $rtask = new rTask($task_opts);

        $ret = $rtask->start($commands, 0);

        return $ret;
    }

    /**
     * @param $from
     * @param $to
     * @return array
     * @throws Exception
     */
    public function rename($from, $to): array
    {

        $task_opts = [
            'requester' => $this->name,
            'name' => 'rename',
            'arg' => basename($from) . ' -> ' . basename($to)
        ];

        $rtask = new rTask($task_opts);

        $ret = $rtask->start(
            [TaskController::recursiveMove($this->rootPath($from), $this->rootPath($to))],
            rTask::FLG_WAIT
        );

        return $ret;
    }

    /**
     * @param $directory_path
     * @return array
     * @throws Exception
     */
    public function listDir($directory_path)
    {

        $output = [];
        $directory_path = $this->rootPath($directory_path);

        $find_args = [Helper::mb_escapeshellarg($directory_path), '-mindepth', '1', '-maxdepth', '1', '-printf', escapeshellarg('%y\\t%f\\t%s\\t%C@\\t%#m\\n')];

        $i = 0;
        foreach (RemoteShell::get()->execOutput('find', $find_args) as $fileline) {

            if (empty($fileline)) {
                continue;
            }

            $f = [];

            list($fd, $f['name'], $f['size'], $f['time'], $f['perm']) = explode("\t", trim($fileline));

            $f['name'] = stripslashes($f['name']);
            $f['type'] = $fd;
            $f['time'] = intval($f['time']);

            if ($fd == 'd') {
                $f['name'] .= DIRECTORY_SEPARATOR;
                $f['size'] = '';
            }

            $output[$i] = $f;
            $i++;

        }


        return $output;
    }
}
