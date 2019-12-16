<?php
namespace Flm;
use \Exception;

class Archive {
    
    static $rar = array('compress' => '',
                        'extract' => '');
    public $file;
    public $options;
    
    public function __construct($archive_file) {
        $this->file=$archive_file;
    }
    
    public function setOptions($options) {
        
        $aopts =  Helper::getConfig('archive');
        $aopts = $aopts['type'][$options['type']];

        $a['type'] = $options['type'];
        $a['comp'] = $aopts['compression'][$options['compression']];
        $a['volume'] = (intval($options['volumeSize'])*1024);
        $a['multif'] = (($a['type'] == 'rar') && (isset($options['format']) && $options['format'] == 'old')) ? '-vn' : '';
        
        $a['workdir'] = $options['workdir'];
        
          if(isset($options['password']) && !empty($options['password'])
                && ($a['type'] == 'rar' || $a['type'] == 'zip')
          )
            { 
            $a['password'] = $options['password']; 
        }

        $this->options = $a;
        
        return $this;
    }
    public function create ($files) {

        if(is_null($this->options)) {
            
            throw new Exception("Please load setOptions first", 1);
            
        }


        switch($this->options['type']) {
                
                case 'gzip':
                case 'tar':
                case 'bzip2':
                    $bin = 'tar';
                    break;
                case 'rar':
                    $bin = 'rar';
                    break;
                case 'zip':
                    $bin = 'zip';
                    break;
                default: 
                    $bin = false;
        }
        
        if(!$bin) {
            throw new Exception("Unsuported archive format ".$this->options['type'], 16);
        }
        
                 
                       
        $temp = Helper::getTempDir();
        
        
        $args = array('action' => 'compressFiles',
                        'params' => array(
                            'files' => array_map(function($e) {return ltrim($e,'/');}, $files),
                            'archive' => $this->file,
                            'options' => $this->options,
                             'binary'=>getExternal($bin)
                            ),
                        'temp' => $temp );
                        
         $task = $temp['dir'].'task';    
            
        file_put_contents($task, json_encode($args));

            $task_opts = [
                'requester'=>'filemanager',
                'name'=>'compress',
                'arg' =>  count($files) . ' files in ' .  $this->file
            ];
                        
             $rtask = new \rTask( $task_opts );
             $commands = array( Helper::getTaskCmd() ." ". escapeshellarg($task) );
                    $ret = $rtask->start($commands, 0);    
             
           //var_dump($ret);
           
             return $temp;
    }

   
    public static function getFormatBinary($file) {
        
       switch(pathinfo($file, PATHINFO_EXTENSION)) {
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

    public  function extract($to) {

             
        $formatBin = self::getFormatBinary($this->file);
        
        if(!$formatBin) {
            throw new Exception("Error Processing Request", 18);
        }
    
        $temp = Helper::getTempDir();
        
        
        $args = array('action' => 'extract',
                        'params' => array('file' => $this->file,
                                            'to' => $to,
                                            'binary'=>getExternal($formatBin)),
                        'temp' => $temp );
                        
         $task = $temp['dir'].'task';    
            
        file_put_contents($task, json_encode($args));
        


            $task_opts = [
                'requester'=>'filemanager',
                            'name'=>'unpack',
                'arg' => '1 files to ' . $to
                        ];
                    
         $rtask = new \rTask( $task_opts );
         $commands = array( Helper::getTaskCmd() ." ". escapeshellarg($task) );
         $ret = $rtask->start($commands, 0);   



        return $temp;
    
    }

   
}