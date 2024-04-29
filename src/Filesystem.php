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
     */
    public function __construct($root)
    {
        $this->root = FileUtil::addslash($root);
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
        if (self::isDir($target))
        {
            throw new Exception($target, 16);
        }
        $res = ShellCmds::mkdir($this->rootPath($target), $recursive, $mode)->runRemote();

        if ($res[0] > 0)
        {
            throw new Exception("Error Processing Request: " . $target, 4);
        }

        return true;
    }

    public function isDir($path): bool
    {
        $path = $this->rootPath($path);
        return RemoteShell::test($path, 'd');
    }

    public function rootPath($relative_path = null): string
    {
        return ($relative_path == null)
            ? $this->root
            : FileUtil::fullpath(trim($relative_path, '/'), $this->root);
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

    /**
     * @throws Exception
     */
    public function copy($files, $dest): array
    {
        $commands = [];
        $to = $this->rootPath($dest);

        $commands = ['echo ' . Helper::mb_escapeshellarg('-> '.$dest)];
        foreach ($files as $file)
        {
            $commands[] = "echo ".Helper::mb_escapeshellarg(basename($file) . " ... ");
            $commands[] = ShellCmds::recursiveCopy($this->rootPath($file), $to)->cmd();
        }

        $rtask = TaskController::task([
            'name' => 'copy',
            'arg' => count($files) . ' files'
        ]);

        return $rtask->start($commands, rTask::FLG_DEFAULT ^ rTask::FLG_ECHO_CMD  );
    }

    public function move($files, $to): array
    {
        $commands = [];
        $to = $this->rootPath($to);

        foreach ($files as $file)
        {
            $file = $this->rootPath($file);
            $commands[] = ShellCmds::recursiveMove($file, $to)->cmd();
        }

        $rtask = TaskController::task([
            'name' => 'move',
            'arg' => count($files) . ' files',
            'files' => $files
        ]);

        $ret = $rtask->start($commands, 0);

        return $ret;
    }

    public function remove($files): array
    {
        $commands = [];

        foreach ($files as $file)
        {
            $commands[] = ShellCmds::recursiveRemove($this->rootPath($file))->cmd();
        }

        $rtask = TaskController::task([
            'name' => 'remove',
            'arg' => count($files) . ' files',
            'files' => $files
        ]);

        $ret = $rtask->start($commands, 0);

        return $ret;
    }

    /**
     * @param $from
     * @param $to
     * @return array
     * @throws Exception
     */
    public function rename($from, $to): bool
    {
        $res = ShellCmd::bin('mv', ['-f', $this->rootPath($from), $this->rootPath($to)])
            ->end('&& echo')->addArgs([$to])
            ->runRemote();

        if ($res[0] > 0)
        {
            throw new Exception(implode("\n", $res[1]), 4);
        }

        return true;
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

        $find_args = [$directory_path, '-mindepth', '1', '-maxdepth', '1', '-printf', '%y\\t%f\\t%s\\t%C@\\t%#m\\n'];

        $i = 0;
        $result = ShellCmd::bin('find', $find_args)->runRemote();

        foreach ($result[1] as $fileline)
        {
            if (!empty($fileline))
            {

                $item = explode("\t", trim($fileline));
                $f = [
                    'type' => $item[0],
                    'name' => stripslashes($item[1]),
                    'size' => $item[2],
                    'time' => (int)$item[3],
                    'perm' => $item[4],
                ];


                if ($f['type'] == 'd')
                {
                    $f['name'] .= DIRECTORY_SEPARATOR;
                    $f['size'] = '';
                }

                $output[$i] = $f;
                $i++;
            }

        }

        return $output;
    }
}
