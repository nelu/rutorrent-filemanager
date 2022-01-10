<?php
namespace Flm;

use FileUtil;
use Utility;
use User;

class Helper {
    
    
    const task_file = 'btask.php';
    
    protected static $tmpdir;
    
    protected static $config;

    protected static function newTempDir() {

        
        $tmp['tok'] = User::getUser().time().rand(5, 20);
        $tmp['dir'] = FileUtil::addslash(self::$config['tempdir']).'.rutorrent/.fman/'.$tmp['tok'].'/';
       
        
        Filesystem::get()->mkdir($tmp['dir'], true, 777);

        return $tmp;         
    }
    
    public static function getTempDir($token = null) {
        

        
         if($token !== null) {
                return array('tok' => $token, 
                             'dir' => FileUtil::addslash( FileUtil::addslash(self::$config['tempdir']).'.rutorrent/.fman/'.$token ),
                             );
         }

        if(is_null(self::$tmpdir)) {
            $tmp = self::newTempDir();
            self::$tmpdir = $tmp;
        }
        return self::$tmpdir;
    }

    public static function getExt($file) {
        return (pathinfo($file, PATHINFO_EXTENSION));
    }
    public static function getTaskCmd() {
        return Utility::getPHP(). ' '. dirname(__FILE__) .'/..'. DIRECTORY_SEPARATOR. self::task_file;
    }
    
    public static function escapeCmdArgs( $args) {
       
       // bjects only 
        $args = !is_array($args) ? (array) $args : $args;
        
       
        foreach ($args as $key => $value) {
            if($key === 'binary')
            {
                continue;
            }

            if( is_array($value) || is_object($value)) {
                $args[$key] =  self::escapeCmdArgs($value);
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
        return '"' . str_replace(array('"', '%'), array('', ''), $arg) . '"';
    } else {
        return "'" . str_replace("'", "'\\''", $arg) . "'";
    }
}
    
        
    public static function remote_test($dirname, $o) {
        /*
         * Test's to check if $arg1 exists from rtorrent userid
         * 
         *  @param string target - full path
         *  @param string option to use with test
         * 
         *  Example: $this->remote_test('/tmp', 'd');
         *  For test command options see: http://linux.about.com/library/cmd/blcmdl1_test.htm
         */
        return RemoteShell::test($dirname, $o);
    }

    
    public function readTaskLog($file, $lpos = 0) {
    
        $output = array();

        $log['pos'] = (filter_var($lpos, FILTER_VALIDATE_INT) !== FALSE) ? $lpos : 0;
        $log['file'] = $file;


        $log['contents'] = file($log['file']);
        $log['slice'] = array_slice($log['contents'], $log['pos']);

        $output['lp'] = $log['pos'] + count($log['slice']);
        $output['status'] = (trim(substr(end($log['contents']),0, 2)) == 1) ? 1 : 0;

        $output['lines'] = '';

        foreach ($log['slice'] as $line) {
            $output['lines'] .= trim(substr($line, 2, -1))."\n";
        }
        return $output;
    }
    
    public static function getConfig($section = null) {

        if(is_null(self::$config)) {

     //       var_dump(__METHOD__, 'loaoding config');

            eval(FileUtil::getPluginConf('filemanager'));

            if(!isset($config))
            {
               require_once(dirname(__FILE__). '/../conf.php');
            }

            // var_dump(__METHOD__, 'loaoding config', $config);

            self::$config = $config;
        }
     
        return !is_null($section) ? self::$config[$section] : self::$config;
     }

    public static function getTorrentHashFilepath($hash, $fno) {
        
            $fno = intval($fno);
        
          $req = new \rXMLRPCRequest( new \rXMLRPCCommand( "f.get_frozen_path", array($hash,$fno)) );
          
          $filename = '';
          
          if($req->success())
            {
                $filename = $req->val[0];
                if($filename=='')
                {
                    $req = new \rXMLRPCRequest( array(
                        new \rXMLRPCCommand( "d.open", $hash ),
                        new \rXMLRPCCommand( "f.get_frozen_path", array($hash,$fno) ),
                        new \rXMLRPCCommand( "d.close", $hash ) ) );
                    if($req->success())
                        $filename = $req->val[1];
                }
        
                
            }
            
          return $filename;
    }
}

class Settings {
        public $hash = 'flm.dat';
    public $data = array();
    static public function load()
    {
        $cache = new \rCache();
        $rt = new mediainfoSettings();
        return( $cache->get($rt) ? $rt : null );
    }
}

class mediainfoSettings
{
    public $hash = "mediainfo.dat";
    public $data = array();
    static public function load()
    {
        $cache = new \rCache();
        $rt = new mediainfoSettings();
        return( $cache->get($rt) ? $rt : null );
    }
}