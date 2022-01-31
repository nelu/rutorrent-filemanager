<?php

namespace Flm;

use \rXMLRPCCommand;
use \Exception;
use rXMLRPCRequest;

require_once(realpath(dirname(__FILE__) . '/../../../php/xmlrpc.php'));

class RemoteShell extends rXMLRPCRequest
{

    public static $instance;

    public static function test($target, $o): bool
    {
        $args = ['-' . $o, escapeshellarg($target)];
        return self::get()->execOutput('test', $args, 1) ? false : true;
    }

    public function execCmd($shell_cmd, $args = [])
    {
        $cmd = self::merge_cmd_args($shell_cmd, $args);

        $this->addCommand(new rXMLRPCCommand('execute', $cmd));

        return $this->success();
    }

    public static function merge_cmd_args($shell_cmd, $args)
    {
        return array_merge([$shell_cmd], $args);
    }

    public static function get()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * @param $shell_cmd
     * @param $args
     * @return array
     * @throws Exception
     */
    public function execOutput($shell_cmd, $args, $validcode = 0)
    {
        $cmd = self::merge_cmd_args($shell_cmd, $args);

        $cmd[] = '2>&1; echo $? && exit 0';

        $ncmd = ['sh', '-c', implode(" ", $cmd)];

        $this->addCommand(new rXMLRPCCommand('execute_capture', $ncmd));

        if (!$this->success()) {
            throw new Exception("Error " . $this->val[1], $this->val[0]);
        }

        $code = self::getExitCode($this->val[0]);

        if ($code > $validcode) {
            throw new Exception($this->val[0], $code);
        }

        return (bool)$validcode ? (bool)$code : explode("\n", trim($this->val[0]));
    }

    public static function getExitCode(&$output): int
    {
        $code = 0;

        if (is_null($output)) {
            $output = '';
        }

        // look for exit code at the end out the output
        if (preg_match('/(.*\n)?([0-9]+)\n?$/s', $output, $matches)) {
            $output = $matches[1];
            $code = (int)$matches[2];
        }

        return $code;
    }

    public function execBackground($shell_cmd, $args)
    {
        $cmd = $shell_cmd . ' ' . escapeshellarg($args) . ' > /dev/null &';

        $what = ['sh', '-c', $cmd];

        $this->addCommand(new rXMLRPCCommand('execute', $what));

        return $this->success();
    }
}
