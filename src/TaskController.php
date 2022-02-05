<?php

namespace Flm;

use \Exception;
use FileUtil;
use rTask;
use Throwable;
use Utility;

class TaskController
{
    const task_entrypoint = 'btask.php';

    public $info;


    public function __construct()
    {

    }

    public static function log($line, $console_output = true)
    {
        if ($console_output) {
            echo $line . "\n";
        }
    }

    public static function getTaskCmd($method, $args = [])
    {
        $a = [
            FileUtil::fullpath(self::task_entrypoint, __DIR__ . '/..'),
            Helper::mb_escapeshellarg($method)
        ];

        array_map(function ($arg) use (&$a) {
            $a[] = Helper::mb_escapeshellarg($arg);
        }, $args);

        return Utility::getPHP() . " " . implode(" ", $a);
    }

    public static function from($task_opts)
    {
        $rtask = self::task($task_opts);
        // extending rTask the wrong way
        $rtask->writeFile = function ($file, $data) use ($rtask) {
            return self::writeTaskFile($rtask, basename($file), $data);
        };

        return $rtask;
    }

    public static function task($task_opts = []): rTask
    {
        if (empty($task_opts)) {
            throw new Exception("Invalid task options");
        }

        $task_opts = array_merge(['requester' => 'filemanager'], $task_opts);
        return new rTask($task_opts);
    }

    /**
     * @param $rtask rTask
     * @param $file
     * @param $data
     * @return string
     */
    public static function writeTaskFile($rtask, $file, $data)
    {

        $taskDir = $rtask->makeDirectory();
        $out_file = $taskDir . '/' . $file;
        file_put_contents($out_file, $data);
        return $out_file;
    }

    public function handle($cmdArgs = [])
    {
        $entry = array_shift($cmdArgs); // entrypoint
        $success = false;
        if (count($cmdArgs) > 1) {
            $taskMethod = array_shift($cmdArgs);
            $parts = explode("::", $taskMethod);

            $taskClass = $this;

            if (count($parts) > 1) {
                $taskMethod = $parts[1];
                $taskClass = $parts[0];
            }

            if (!method_exists($taskClass, $taskMethod)) {
                $this->error("Invalid method/argument: " . $taskClass . '::' . $taskMethod);
                return false;
            }

            $success = call_user_func_array([$taskClass, $taskMethod], $cmdArgs);
            //$success && self::log("\n--- Done");
        }

        return $success;
    }

    public static function error($line)
    {
        return fwrite(STDERR, $line . PHP_EOL);
    }

}
