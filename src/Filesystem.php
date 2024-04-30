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
        if (self::isDir($target)) {
            throw new Exception($target, 16);
        }
        $res = ShellCmds::mkdir($this->rootPath($target), $recursive, $mode)->runRemote();

        if ($res[0] > 0) {
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
        $to = $this->rootPath($dest);

        $commands = ['echo ' . Helper::mb_escapeshellarg('-> ' . $dest)];
        foreach ($files as $file) {
            $commands[] = "printf '%s' " . Helper::mb_escapeshellarg(basename($file) . " ... ");
            $commands[] = ShellCmds::recursiveCopy($this->rootPath($file), $to)
                ->cmd();

            $commands =
                array_merge($commands,
                    ["{", 'echo ' . Helper::mb_escapeshellarg("✔"), '}'],
                    ['!{', 'echo ' . Helper::mb_escapeshellarg("✖"), '}']
                );
        }

        $rtask = TaskController::task([
            'name' => 'copy',
            'arg' => count($files) . ' files'
        ]);

        return $rtask->start($commands, rTask::FLG_DEFAULT ^ rTask::FLG_ECHO_CMD);
    }

    /**
     * @throws Exception
     */
    public function move($files, $to): array
    {
        $commands = [];
        $commands = ['echo ' . Helper::mb_escapeshellarg('-> ' . $to)];

        $to = $this->rootPath($to);

        foreach ($files as $file) {
            $file = $this->rootPath($file);
            $commands[] = "printf '%s' " . Helper::mb_escapeshellarg(basename($file) . " ... ");
            $commands[] = ShellCmds::recursiveMove($file, $to)->cmd();

            $commands =
                array_merge($commands,
                    ["{", 'echo ' . Helper::mb_escapeshellarg("✔"), '}'],
                    ['!{', 'echo ' . Helper::mb_escapeshellarg("✖"), '}']
                );

            // ->end('&& echo')->addArgs(['✓ ' . basename($file)])
        }

        $rtask = TaskController::task([
            'name' => 'move',
            'arg' => count($files) . ' files',
            'files' => $files
        ]);

        $ret = $rtask->start($commands, rTask::FLG_DEFAULT ^ rTask::FLG_ECHO_CMD);

        return $ret;
    }

    public function remove($files): array
    {
        $commands = [];

        foreach ($files as $file) {
            $commands[] = ShellCmds::recursiveRemove($this->rootPath($file))->cmd();
        }

        $rtask = TaskController::task([
            'name' => 'remove',
            'arg' => count($files) . ' files',
            'files' => $files
        ]);

        $ret = $rtask->start($commands, rTask::FLG_DEFAULT ^ rTask::FLG_ECHO_CMD);

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
        $res = ShellCmds::recursiveMove($this->rootPath($from), $this->rootPath($to))
            ->runRemote();

        if ($res[0] > 0) {
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

        foreach ($result[1] as $fileline) {
            if (!empty($fileline)) {

                $item = explode("\t", trim($fileline));
                $f = [
                    'type' => $item[0],
                    'name' => stripslashes($item[1]),
                    'size' => $item[2],
                    'time' => (int)$item[3],
                    'perm' => $item[4],
                ];


                if ($f['type'] == 'd') {
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
