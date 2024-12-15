<?php

namespace Flm;

use Exception;
use FileUtil;
use rXMLRPCCommand;
use rXMLRPCRequest;

require_once(realpath(dirname(__FILE__) . '/../../../php/xmlrpc.php'));

class RemoteShell extends rXMLRPCRequest
{

    public static $instance;

    public static function test($target, $o): bool
    {
        $args = ['-' . $o, $target];
        $res = ShellCmd::bin('test', $args)->runRemote();
        $exitCode = $res[0];
        return ($exitCode === 0);
    }

    public static function merge_cmd_args($shell_cmd, $args)
    {
        return array_merge([$shell_cmd], $args);
    }

    public static function get()
    {
        if (is_null(self::$instance))
        {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function getExitCode(&$output): int
    {
        $code = 0;

        if (is_null($output))
        {
            $output = '';
        }

        // look for exit code at the end of the output
        if (preg_match('/(.*?)([0-9]+)?\n?$/s', $output, $matches))
        {
            $output = $matches[1];
            if (isset($matches[2]))
            {
                $code = (int)$matches[2];
            }
        }

        return $code;
    }

    public function execCmd($shell_cmd, $args = [])
    {
        $cmd = self::merge_cmd_args($shell_cmd, $args);

        $this->addCommand(new rXMLRPCCommand('execute', $cmd));

        return $this->success();
    }

    /**
     * @param ShellCmd $scmd
     * @param $args
     * @param int $exitCode
     * @return array
     * @throws Exception
     */
    public function execOutput(ShellCmd $scmd, &$exitCode = 0)
    {
        $shell_cmd =  ['sh', '-c', $scmd->cmd(). ' 2>&1; echo $? && exit 0'];

        $this->addCommand(new rXMLRPCCommand('execute_capture', $shell_cmd));

        if (!$this->success())
        {
            throw new Exception("Error " . $this->val[1], $this->val[0]);
        }

        $code = self::getExitCode($this->val[0]);

        if ($code > $exitCode)
        {
            throw new Exception($this->val[0], $code);
        }

        $exitCode = $code;

        Helper::getConfig("debug") && FileUtil::toLog(__METHOD__ . ' DEBUG cmd ' . var_export([$shell_cmd, trim($this->val[0])], true));

        return explode("\n", trim($this->val[0]));
    }

    public function execBackground($shell_cmd, $args)
    {
        $cmd = $shell_cmd . ' ' . escapeshellarg($args) . ' > /dev/null &';

        $what = ['sh', '-c', $cmd];

        $this->addCommand(new rXMLRPCCommand('execute', $what));

        return $this->success();
    }
}
