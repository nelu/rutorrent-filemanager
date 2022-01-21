<?php

namespace Flm;

use FileUtil;
use Utility;
use User;

class Helper
{


    const task_file = 'btask.php';

    protected static $tmpdir;

    protected static $config;


    public static function registerAutoload($dir = __DIR__, $prefix = __NAMESPACE__) {
        spl_autoload_register(function ($class) use ($dir, $prefix) {

            $prefix .=  '\\';
            // does the class use the namespace prefix?
            if (stripos($class, $prefix) === false)
            {
                return;
            }


            // replace the namespace prefix with the base directory, replace namespace
            // separators with directory separators in the relative class name, append
            // with .php
            $file =  $dir . '/'. str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
      
            if (file_exists($file)) {
                require $file;
            }
        });
    }
    public static function getTempDir($token = null)
    {

        if ($token !== null) {
            return [
                'tok' => $token,
                'dir' => FileUtil::addslash(FileUtil::getTempDirectory() . $token),
            ];
        }

        if (is_null(self::$tmpdir)) {
            $tmp = self::newTempDir();
            self::$tmpdir = $tmp;
        }
        return self::$tmpdir;
    }

    protected static function newTempDir()
    {
        $tmp['dir'] = FileUtil::getTempFilename('fman') . DIRECTORY_SEPARATOR;
        $tmp['tok'] = basename($tmp['dir']);

        (new Filesystem('/'))->mkdir($tmp['dir'], true, 777);

        return $tmp;
    }

    public static function getExt($file)
    {
        return (pathinfo($file, PATHINFO_EXTENSION));
    }

    public static function getTaskCmd()
    {
        return Utility::getPHP() . ' ' . dirname(__FILE__) . '/..' . DIRECTORY_SEPARATOR . self::task_file;
    }

    public static function escapeCmdArgs($args)
    {

        // bjects only
        $args = !is_array($args) ? (array)$args : $args;


        foreach ($args as $key => $value) {
            if ($key === 'binary') {
                continue;
            }

            if (is_array($value) || is_object($value)) {
                $args[$key] = self::escapeCmdArgs($value);
                continue;
            }
            /*       else if( !is_string($value)) {
                       var_dump($value);
                       throw new \Exception("bad value submitted", 1);
                    }*/
            $args[$key] = self::mb_escapeshellarg($value);
        }

        return $args;
    }


    public static function mb_escapeshellarg($arg)
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            return '"' . str_replace(['"', '%'], ['', ''], $arg) . '"';
        } else {
            return "'" . str_replace("'", "'\\''", $arg) . "'";
        }
    }

    public static function getConfig($section = null)
    {

        if (is_null(self::$config)) {

            eval(FileUtil::getPluginConf('filemanager'));

            if (!isset($config)) {
                require_once(dirname(__FILE__) . '/../conf.php');
            }

            self::$config = $config;
        }

        return !is_null($section) ? self::$config[$section] : self::$config;
    }

    public static function getTorrentHashFilepath($hash, $fno)
    {

        $fno = intval($fno);

        $req = new \rXMLRPCRequest(new \rXMLRPCCommand("f.get_frozen_path", [$hash, $fno]));

        $filename = '';

        if ($req->success()) {
            $filename = $req->val[0];
            if ($filename == '') {
                $req = new \rXMLRPCRequest([
                    new \rXMLRPCCommand("d.open", $hash),
                    new \rXMLRPCCommand("f.get_frozen_path", [$hash, $fno]),
                    new \rXMLRPCCommand("d.close", $hash)]);
                if ($req->success())
                    $filename = $req->val[1];
            }


        }

        return $filename;
    }
}

class Settings
{
    public $hash = 'flm.dat';
    public $data = [];

    static public function load()
    {
        $cache = new \rCache();
        $rt = new mediainfoSettings();
        return ($cache->get($rt) ? $rt : null);
    }
}

class mediainfoSettings
{
    public $hash = "mediainfo.dat";
    public $data = [];

    static public function load()
    {
        $cache = new \rCache();
        $rt = new mediainfoSettings();
        return ($cache->get($rt) ? $rt : null);
    }
}

