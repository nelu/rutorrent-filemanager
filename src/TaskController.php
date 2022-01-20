<?php

namespace Flm;

use \Exception;
use rTask;
use Throwable;

class TaskController
{

    public $info;

    public function __construct($task_file = null)
    {

        if (!is_null($task_file)) {
            $this->info = json_decode(file_get_contents($task_file));

            $this->log = $this->info->temp->dir . 'log';
            umask(0);
        }
    }


    public static function errorLog($line)
    {
        return fwrite(STDERR, $line . PHP_EOL);
    }

    public function handle()
    {
        if (isset($this->info->params->workdir)
            && !empty($this->info->params->workdir)) {

            chdir($this->info->params->workdir);
        }


        $success = $this->run();

        $success && $this->writeLog("\n--- Done");

        $this->LogCmdExec( self::recursiveRemove($this->info->temp->dir));
    }

    public function run()
    {
        $success = false;
        if (method_exists($this, $this->info->action)) {
            $success = call_user_func([$this, $this->info->action]);
        }

        return $success;
    }

    public function writeLog($line, $console_output = true)
    {
        if ($console_output) {
            echo $line . "\n";
        }
    }

    public static function mkdir($target, $recursive = false, $mode = null)
    {
        $args = ['mkdir'];

        if($mode != null)
        {
            $args[] = '--mode=' . $mode;
        }
        if ($recursive) {
            $args[] = '-p';
        }

        $args[] = Helper::mb_escapeshellarg($target);;

        return $args;
    }

    public static function recursiveCopy($source, $to)
    {
        $fName = Helper::mb_escapeshellarg('✓ ' . basename($source));
        $source = Helper::mb_escapeshellarg($source);
        $to = Helper::mb_escapeshellarg($to);

        return "cp -rpv {$source} {$to} && echo {$fName}";
    }

    public static function recursiveMove($file, $to): string
    {
        $fName = Helper::mb_escapeshellarg('✓ ' . basename($file));
        $file = Helper::mb_escapeshellarg($file);
        $to = Helper::mb_escapeshellarg($to);

        return "mv -f ${file} ${to} && echo {$fName}";
    }

    public static function recursiveRemove($file): string
    {
        $fName = Helper::mb_escapeshellarg('✓ ' .basename($file));
        $file = Helper::mb_escapeshellarg($file);
        $cmd = "rm -rf {$file} && echo {$fName}";

        return $cmd;
    }

    public function compressFiles()
    {

        $task_opts = [
            'requester' => 'filemanager',
            'name' => 'compress',
            'arg' => count($this->info->params->files) . ' files in ' . $this->info->params->archive
        ];

        $ret = false;
        try {
            $cmds = [
                'cd ' . Helper::mb_escapeshellarg($this->info->params->options->workdir),
                '{', FsUtils::getArchiveCompressCmd($this->info->params), '}',
            ];

            $rtask = new rTask($task_opts);
            $ret = $rtask->start($cmds, rTask::FLG_DEFAULT);
        } catch (Throwable $err) {
            $ret = $err;
        }

        return $ret;
    }


    public function LogCmdExec($cmd)
    {
        //    $cmd =  $cmd.' > '.$this->log.' 2>&1';

        // capture first pipe exitcode and enable buffering using sed -u
        $cmd = '/bin/bash -o pipefail -c ' . Helper::mb_escapeshellarg($cmd . <<<CMD
 2>&1 | sed -u 's/^//'
CMD
            );
        $output = [];

        passthru($cmd, $exitCode);

        if ($exitCode > 0) {
            throw new Exception('Command error: ' . $cmd, $exitCode);
        }

        return $exitCode;
    }

    public function sfvCreate()
    {

        if (($sfvfile = fopen($this->info->params->target, "abt")) === FALSE) {

            $this->writeLog('0: SFV HASHING FAILED. File not writable ' . $this->info->params->target);
        }

        // comments
        fwrite($sfvfile, "; ruTorrent filemanager;\n");


        $check_files = new SFV($this->info->params->files);
        $fcount = count($this->info->params->files);


        foreach ($check_files as $i => $sfvinstance) {

            $file = $sfvinstance->getCurFile();
            $msg = '(' . $i . '/' . $fcount . ') Hashing ' . basename($file) . ' ... ';

            try {
                $hash = SFV::getFileHash($file);

                fwrite($sfvfile, end(explode('/', $file)) . ' ' . $hash . "\n");
                $this->writeLog($msg . ' - OK ' . $hash);
            } catch (Exception $err) {
                $this->writeLog($msg . ' - FAILED:' . $err->getMessage());

            }


        }

        fclose($sfvfile);


    }

    public function sfvCheck()
    {


        $check_files = new SFV($this->info->params->target);

        $fcount = $check_files->length();


        foreach ($check_files as $i => $item) {

            $file = $item->getCurFile();

            $msg = '(' . $i . '/' . $fcount . ') Checking ' . trim($file) . ' ... ';

            try {

                if (!$item->checkFileHash()) {
                    $this->writeLog($msg . '- FAILED: hash mismatch ');
                }
                $this->writeLog($msg . '- OK ');
            } catch (Exception $err) {

                $this->writeLog($msg . '- FAILED:' . $err->getMessage());

            }

        }


        $this->writeLog("OK: files match\n");
    }

}
