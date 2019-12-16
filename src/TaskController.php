<?php
namespace Flm;
use \Exception;
use Throwable;

class TaskController {
    
    public $info;
    public function __construct($task_file = null) {
        
        if(!is_null($task_file)){
            $this->info = json_decode(file_get_contents($task_file));

            $this->log = $this->info->temp->dir. 'log';
            umask(0);
         }
    }

    public function handle() {
        if(isset($this->info->params->workdir)
            && !empty($this->info->params->workdir)) {

            chdir ($this->info->params->workdir);
        }


        $success = $this->run();

        $success && $this->writeLog("\n--- Done");
        $this->recursiveRemove(array($this->info->temp->dir), false);
    }
    public function run(){
        $success = false;
        if(method_exists($this, $this->info->action)) {
            $success= call_user_func(array($this,  $this->info->action));
        }

        return $success;
    }
    
    public function compressFiles()
    {

        $task_opts = [
            'requester'=>'filemanager',
            'name'=>'compress',
            'arg' =>  count($this->info->params->files) . ' files in ' .  $this->info->params->archive
        ];

        $ret = false;
        try {
            $cmds = [
                'cd ' . Helper::mb_escapeshellarg($this->info->params->options->workdir),
                FsUtils::getArchiveCompressCmd($this->info->params)
            ];

            $rtask = new \rTask( $task_opts );
            $ret = $rtask->start($cmds, 0);
        }
        catch (Throwable $err) {
            self::errorLog($err->getMessage() . PHP_EOL . $err->getTraceAsString());
            $ret = $err;
        }

        return $ret;
    }

    public function recursiveCopy() :bool
    {

        $total = count($this->info->params->files);
        $hasFail = null;
        foreach ($this->info->params->files as $i => $file) {


          $copycmd = FsUtils::getCopyCmd($file, $this->info->params->to);

          try {
                $this->LogCmdExec($copycmd);
                $this->writeLog('OK: ('.++$i.'/'.$total.') -> '. $file);
          } catch (Throwable $err) {
              self::errorLog($file .': ' . $err->getMessage() );
              $hasFail = $err;
          }

        }

        if($hasFail)
        {
            self::errorLog( 'Last error trace: ' .  $hasFail->getTraceAsString());
        }

        return empty($hasFail);
    }
    
    public function recursiveMove() : bool
    {
        $hasFail = null;

        foreach ($this->info->params->files as $file)
        {
            $renamecmd = 'mv -f ' . Helper::mb_escapeshellarg($file) . ' ' . Helper::mb_escapeshellarg($this->info->params->to);
            $hasFail = null;

            try {

                $this->LogCmdExec($renamecmd);
                $this->writeLog('OK: ' . $file . ' -> ' . $this->info->params->to);
            } catch (Throwable $err) {
                $hasFail = $err;
                self::errorLog($file . ' failed: ' . $err->getMessage());
            }
        }

        if($hasFail)
        {
            self::errorLog( 'Last error trace: ' . $hasFail->getTraceAsString());
        }
        return empty($hasFail);
    }
    
   public function recursiveRemove($files = null, $verbose = true) :bool
   {
        
        $files = is_null($files) ? $this->info->params->files : $files;
        $hasFail = null;

        foreach ($files as $file) {

          $rmcmd = FsUtils::getRemoveCmd($file);

          try {
                $this->LogCmdExec($rmcmd);
               if($verbose) {$this->writeLog('Removed: '.$file. ' ');}
          } catch (Throwable $err) {
              $hasFail = $err;
              self::errorLog($file . ' failed: ' . $err->getMessage());
          }
        }
       if($hasFail)
       {
           self::errorLog( 'Last error trace: ' . $hasFail->getTraceAsString());
       }
       return empty($hasFail);

   }
    
    
    public function sfvCreate ()
    {
  
        if (($sfvfile  = fopen($this->info->params->target, "abt")) === FALSE) {
            
             $this->writeLog('0: SFV HASHING FAILED. File not writable '.$this->info->params->target);
        }

        // comments        
        fwrite($sfvfile, "; ruTorrent filemanager;\n");


        $check_files = new SFV($this->info->params->files);
        $fcount = count($this->info->params->files);

        
        foreach ($check_files as $i => $sfvinstance) {
            
            $file = $sfvinstance->getCurFile();
            $msg = '('.$i.'/'.$fcount. ') Hashing '.$file.' ... ';

           try {
              $hash = SFV::getFileHash($file);

              fwrite($sfvfile, end(explode('/', $file)).' '.$hash."\n");
              $this->writeLog($msg.' - OK '.$hash); 
          } catch (Exception $err) {
              $this->writeLog($msg. ' - FAILED:'.$err->getMessage());

          }


      }
          
      fclose($sfvfile);

        
        
        
    }
    
    public function sfvCheck ()
    {


        $check_files = new SFV($this->info->params->target);
        
        $fcount = $check_files->length();
        
        
        foreach ($check_files as $i => $item) {
            
            $file = $item->getCurFile();

            $msg = '('.$i.'/'.$fcount. ') Checking '.trim($file).' ... ';

           try {
                   
             if(!$item->checkFileHash() ) {
              $this->writeLog($msg. '- FAILED: hash mismatch ');
             }
              $this->writeLog($msg.'- OK '); 
          } catch (Exception $err) {
          
              $this->writeLog($msg. '- FAILED:'.$err->getMessage());

          }

          }
        

        $this->writeLog("OK: files match\n");
    }

    public function extract ()
    {

        $task_opts = [
            'requester'=>'filemanager',
            'name'=>'unpack',
            'arg' => '1 files to ' . $this->info->params->to
        ];

        try {
            $cmds = [
                'mkdir -p ' . Helper::mb_escapeshellarg($this->info->params->to),
                FsUtils::getArchiveExtractCmd($this->info->params)
            ];

            $rtask = new \rTask( $task_opts );
            $ret = $rtask->start($cmds, 0);
        }
        catch (Throwable $err) {
            self::errorLog($err->getMessage() . PHP_EOL . $err->getTraceAsString());
            $ret = $err;
        }

        return $ret;
        }
    
    public function LogCmdExec($cmd) {
     //    $cmd =  $cmd.' > '.$this->log.' 2>&1';

        // capture first pipe exitcode and enable buffering using sed -u
        $cmd =  '/bin/bash -o pipefail -c ' .Helper::mb_escapeshellarg($cmd .<<<CMD
 2>&1 | sed -u 's/^//'
CMD
            );
        $output = [];

        passthru($cmd, $exitCode);

        if($exitCode > 0) {
            throw new Exception('Command error: '. $cmd, $exitCode);
        }

        return $exitCode;
    }

    public function readLog($lpos = 0) {

        return is_file($this->log) ? Helper::readTaskLog($this->log, $lpos) : false;
    }
    public function writeLog($line, $console_output = true) {
        if($console_output) {echo $line."\n";}
      //  return file_put_contents($this->log, $line."\n", FILE_APPEND );
    }

    public static function errorLog($line)
    {
       return fwrite(STDERR, $line . PHP_EOL);
    }
}
