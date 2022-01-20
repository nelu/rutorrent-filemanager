<?php

namespace Flm;

use \rXMLRPCCommand;
use \Exception;

require_once(realpath(dirname(__FILE__) . '/../../../php/xmlrpc.php'));

class RemoteShell extends \rXMLRPCRequest
{

    public static $instance;

    public static function test($dirname, $o)
    {
        /*
         * Test's to check if $arg1 exists from rtorrent userid
         *
         *  @param string target - full path
         *  @param string option to use with test
         *
         *  Example: $this->remote_test('/tmp', 'd');
         *  For test command options see: http://linux.about.com/library/cmd/blcmdl1_test.htm
         */
        $shell = self::get();
        $shell->addCommand(new \rXMLRPCCommand('execute', ['test', '-' . $o, $dirname]));
        return (bool)$shell->success();
    }

    public static function get()
    {

        if (is_null(self::$instance)) {

            self::$instance = new self();
        }
        return self::$instance;
    }

    public function execOutput($shell_cmd, $args)
    {

        $cmd = self::merge_cmd_args($shell_cmd, $args);

        $cmd[] = ' 2>&1';

        $sucmd = dirname(__FILE__) . '/../scripts/sucmd.sh';
        $ncmd = [$sucmd, implode(" ", $cmd)];


        $this->addCommand(new \rXMLRPCCommand('execute_capture', $ncmd));

        if (!$this->success()
            || ($this->getExitCode($this->val[0])->exitcode > 0)) {
            throw new Exception("Error " . $this->val[0], 10);

        }


        return explode("\n", trim($this->val[0]));

    }

    public static function merge_cmd_args($shell_cmd, $args)
    {

        return array_merge([$shell_cmd], $args);
    }

    public function getExitCode(&$output)
    {


        if (!preg_match('/\{(.*)\}$/', $output, $matches)) {
            return false;

        }

        $new = preg_replace('/\{(.*)\}$/', '', $output);

        $output = $new;

        return json_decode(str_replace('\\"', '"', $matches[0]));
    }

    public function execCmd($shell_cmd, $args = [])
    {

        $cmd = self::merge_cmd_args($shell_cmd, $args);

        $this->addCommand(new rXMLRPCCommand('execute', $cmd));

        return $this->success();
    }

    public function execBackground($shell_cmd, $args)
    {

        $cmd = $shell_cmd . ' ' . escapeshellarg($args) . ' > /dev/null &';

        $what = ['sh', '-c', $cmd];

        $this->addCommand(new rXMLRPCCommand('execute', $what));

        return $this->success();
    }
}
