<?php

namespace Flm;

use Exception;
use FileUtil;
use rTask;
use rTorrentSettings;
use Utility;

class FileManager
{
    public $workdir = '';

    /**
     * @var Filesystem
     */
    protected $fs;
    protected $temp = [];

    protected $settings = [];

    public function __construct($fileSystem, $config, $currentDir = null)
    {
        $this->fs = $fileSystem;
        $this->workDir($currentDir != null ? $currentDir : '/');
        $this->settings = $config;
    }

    static public function dir_sort($a, $b)
    {
        $a_isdir = ($a['type'] == 'd');

        $b_isdir = ($b['type'] == 'd');

        if ($a_isdir && $b_isdir)
        {
            strcmp($a['name'], $b['name']);
        } elseif ($a_isdir)
        {
            return -1;
        } elseif ($b_isdir)
        {
            return 1;
        }

        return strcmp($a['name'], $b['name']);
    }

    public function workDir($directory = null)
    {
        if ($directory != null)
        {
            $this->workdir = FileUtil::addslash($directory);
        }
        /*
            $path_check = explode($this->rootDir, FileUtil::addslash(FileUtil::fullpath($dir, $this->rootDir)));
            if (count($path_check) < 2) {
                $dir = $this->rootDir;
            }
        */

        return $this->workdir;
    }

    public function extractChrootPath($fullPath)
    {
        $f = explode($this->fs->rootPath(), $fullPath);

        $relative = $fullPath;

        if (count($f) > 1)
        {
            $relative = $f[1];
        }

        return '/' . rtrim($relative, '/');
    }

    public function fs()
    {
        return $this->fs;
    }

    /**
     * @param $paths
     * @return array
     * @throws Exception
     */
    public function archive($paths)
    {
        $archive_file = array_shift(Helper::makeRelative($this->currentDir($paths->target)));
        $options = empty($paths->mode) ? [] : (array)$paths->mode;

        $config = Helper::getConfig('archive');

        if (!isset($config['type'][$options['type']]))
        {
            throw new Exception("Invalid type: " . $options['type'], 1);
        }

        $files = Helper::makeRelative((array)$paths->fls);

        if ($this->fs->isFile($archive_file))
        {
            throw new Exception($archive_file, 16);
        }

        $archive = new Archive($archive_file, $config);
        $archive->setWorkDir(FileUtil::addslash($this->getFsPath()));
        $archive->setOptions($options);

        return $archive->create($files);
    }

    public function getFsPath($relative = null)
    {
        return $this->fs->rootPath($this->currentDir($relative));
    }

    public function currentDir($relative_path = null)
    {
        return ($relative_path == null)
            ? $this->workdir
            : FileUtil::fullpath(trim($relative_path, '/'), $this->workdir);
    }

    /**
     * @param $paths
     * @return array
     * @throws Exception
     */
    public function copy($paths): array
    {
        $files = array_map([$this, 'currentDir'], (array)$paths->fls);
        $to = $this->currentDir($paths->to);

        if (count($files) > 1 && !$this->fs->isDir($to))
        {
            throw new Exception("Destination is not directory", 2);
        } elseif (count($files) == 1 && $this->fs->isFile($to))
        {
            throw new Exception("Destination already exists", 2);
        } elseif (count($files) > 1)
        {
            // to must be a directory
            $to = FileUtil::addslash($to);
        }

        $task_info = $this->fs->copy($files, $to);

        return $task_info;
    }

    /**
     * @param $paths
     * @return array
     * @throws Exception
     */
    public function dirlist($paths)
    {
        $dirpath = $this->currentDir($paths->dir);
        $directory_contents = $this->fs->listDir($dirpath);

        usort($directory_contents, [$this, 'dir_sort']);

        foreach ($directory_contents as $key => $value)
        {
            unset($directory_contents[$key]['type']);
        }

        return $directory_contents;
    }

    /**
     * @param $paths
     * @return array
     * @throws Exception
     */
    public function extractFile($paths)
    {
        $to = $this->currentDir($paths['to']);

        if ($this->fs->isFile($to))
        {
            throw new Exception($to, 16);
        } else if (!RemoteShell::test($this->getFsPath($to), 'w'))
        {
            throw new Exception("Not writable: " . $to, 300);
        }
        $count = count($paths['archives']);
        $cmds = [];
        foreach ($paths['archives'] as $archive_file)
        {
            $archive_file = $this->currentDir($archive_file);
            if (!$this->fs->isFile($archive_file))
            {
                throw new Exception($archive_file, 6);
            }

            $archive = new Archive($this->getFsPath($archive_file));
            $archive->setOptions(['password' => $paths['password']]);

            $cmds = array_merge($cmds, $archive->extract($this->getFsPath($to)));
        }

        $rtask = TaskController::from([
            'name' => 'unpack',
            'arg' => $count == 1 ? basename($paths['archives'][0]) : $count . ' items'
        ]);

        return $rtask->start($cmds, rTask::FLG_DEFAULT ^ rTask::FLG_ECHO_CMD);
    }

    public function mediainfo($path)
    {
        $file = $this->currentDir($path->target);

        if (!$this->fs->isFile($file))
        {
            throw new Exception($file, 6);
        }

        $commands = [];
        $flags = '';
        $st = mediainfoSettings::load();
        $task = new rTask([
            'arg' => basename($file),
            'requester' => 'filemanager',
            'name' => 'mediainfo',
            'no' => 0
        ]);
        if ($st && !empty($st->data["mediainfousetemplate"]))
        {
            $randName = $task->makeDirectory() . "/opts";
            file_put_contents($randName, $st->data["mediainfotemplate"]);
            $flags = "--Inform=file://" . escapeshellarg($randName);
        }
        $commands[] = Utility::getExternal("mediainfo") . " " . $flags . " " . Helper::mb_escapeshellarg($this->getFsPath($path->target));
        $ret = $task->start($commands, rTask::FLG_WAIT);

        return $ret;
    }

    /**
     * @param $paths
     * @return array
     * @throws Exception
     */
    public function move($paths)
    {
        $files = array_map([$this, 'currentDir'], (array)$paths->fls);

        // destination is dir ending in /
        $to = FileUtil::addslash($this->currentDir($paths->to));

        if (!$this->fs->isDir($to))
        {
            throw new Exception("Destination is not directory: " . $paths->to, 2);
        }

        $task_info = $this->fs->move($files, $to);

        return $task_info;
    }


    /**
     * @param $dirpath
     * @return bool
     * @throws Exception
     */
    public function newDir($dirpath)
    {
        return $this->fs->mkdir($this->currentDir($dirpath), true, Helper::getConfig('mkdperm'));
    }

    /**
     * @param $file
     * @param bool $dos
     * @return mixed|string|string[]|null
     * @throws Exception
     */
    public function nfo_get($file, $dos = TRUE)
    {
        $fullpath = $this->getFsPath($file);

        if (!is_file($fullpath))
        {
            throw new Exception($file, 6);
        } elseif (!preg_match('/' . $this->settings['textExtensions'] . '/', Helper::getExt($fullpath))
            || (filesize($fullpath) > 50000))
        {
            throw new Exception($file, 18);
        }

        $nfo = new NfoView($fullpath);

        return $nfo->get($dos);
    }

    /**
     * @param $paths
     * @return array
     * @throws Exception
     */
    public function rename($paths): array
    {
        $file = $this->currentDir($paths->file);
        $to = $this->currentDir($paths->to);

        if (!$this->fs->pathExists($file))
        {
            throw new Exception($file, 6);
        }
        if ($this->fs->pathExists($to))
        {
            throw new Exception($to, 16);
        }

        $res = $this->fs->rename($file, $to);

        if ($res)
        {
            rTorrentSettings::get()->pushEvent('File_rename', [$file, $to]);
        }

        return ['success' => $res];
    }

    public function remove($paths): array
    {
        $files = array_map([$this, 'currentDir'], (array)$paths->fls);
        $task_info = $this->fs->remove($files);

        return $task_info;
    }

    /**
     * @param $paths
     * @return array|mixed
     * @throws Exception
     */
    public function checksumVerify($paths)
    {
        $sfvfile = $this->currentDir($paths->target);

        if (Helper::getExt($sfvfile) != 'sfv')
        {
            throw new Exception($sfvfile, 18);
        }

        if (!$this->fs->isFile($sfvfile))
        {
            throw new Exception($sfvfile, 6);
        }

        $sfvfile = $this->getFsPath($sfvfile);

        $task_opts = [
            'name' => 'checksum-verify',
            'arg' => $this->currentDir($paths->target)
        ];

        $rtask = TaskController::from($task_opts);
        $commands = [TaskController::getTaskCmd(FileChecksum::class . '::fromChecksumFile', [$sfvfile])];

        $ret = $rtask->start($commands, 0);

        return $ret;
    }

    /**
     * @param $paths
     * @return array|mixed
     * @throws Exception
     */
    public function checksumCreate($paths)
    {

        $sfvfile = $this->currentDir($paths->target);
        $files = array_map([$this, 'getFsPath'], (array)$paths->fls);

        if ($this->fs->isFile($sfvfile))
        {
            throw new Exception($sfvfile, 16);
        }

        if (empty($files)) {
            throw new Exception("File list is empty");
        }

        $type = 'CRC32';

        $task_opts = [
            'name' => 'checksum-create',
            'arg' => $sfvfile
        ];

        $rtask = TaskController::from($task_opts);

        $filelist = ($rtask->writeFile)("files.json", json_encode($files));

        $commands = [TaskController::getTaskCmd(FileChecksum::class . '::checksumFromFilelist',
            [$filelist, $this->getFsPath($sfvfile), $type])];

        $ret = $rtask->start($commands, rTask::FLG_DEFAULT);

        return $ret;
    }
}
