<?php


namespace Flm;


use Exception;
use FileUtil;
use rTask;

class ShellCmd
{
    const CMD_END = '';
    protected $binary = '';
    protected $args = [];
    /**
     * @var int
     */
    private $endAt;

    /**
     * ShellCmd constructor.
     * @param string $binary
     */
    public function __construct(string $binary)
    {
        $this->binary($binary);
    }

    /**
     * @param string $bin
     * @return string|P7zip
     */
    public function binary(string $bin = '')
    {
        if (!empty($bin)) {
            $this->binary = $bin;
            return $this;
        }
        return $this->binary;
    }

    /**
     * @param $bin
     * @param array $args
     * @return ShellCmd
     */
    public static function bin($bin, $args = []): ShellCmd
    {
        return (new static($bin))->setArgs($args);
    }

    /**
     * @return array
     * @throws Exception
     */
    public function run()
    {
        $cmd = $this->end('2>&1')->cmd();
        exec($cmd, $output, $exit);

        Helper::getConfig("debug") && FileUtil::toLog(__METHOD__ . ' DEBUG cmd ' . var_export([$cmd, $output, $exit], true));

        return [$exit, $output];
    }

    /**
     * @param bool $asArray
     * @return string|array
     * @throws Exception
     */
    public function cmd($asArray = false)
    {
        if (empty($this->binary)) {
            throw new Exception("Command binary not set");
        }

        $formatted_args = [];
        //compile arguments
        array_walk($this->args, function (&$item, $key) use (&$formatted_args) {
            $r = null;
            // null is disabled
            if (!is_null($item)) {

                if (is_int($key)) {
                    // exclude numeric keys value from arg value
                    $key = '';
                }
                if (is_bool($item) && $item === true) {
                    $r = $key;
                } elseif (is_string($item)) {
                    // trim spaces from positional/no name arguments
                    $r = ltrim($key, " ") . Helper::mb_escapeshellarg($item);
                } elseif (is_int($item)) {
                    // int we hope
                    $r = $key . $item;
                }

                if (!is_null($r)) {
                    $formatted_args[] = $r;
                }
            }
        });

        $cmd = array_merge([$this->binary], $formatted_args);

        return $asArray ? $cmd : implode(" ", $cmd);
    }

    /** Set the command input/output: | > &
     * When $outputArg is empty it will remove the argument
     * @param string $outputArg
     * @return ShellCmd
     */
    public function end($outputArg = '')
    {
        if (is_string($outputArg) && !empty($outputArg)) {
            unset($this->args[$outputArg]);
            $this->setArg($outputArg, true);
            $this->endAt = $outputArg;
        } elseif (isset($this->endAt)) {
            // remove end or update position
            unset($this->args[$this->endAt]);
            $this->endAt = null;
        }

        return $this;
    }

    public function setArg(string $name, $value)
    {
        $this->args[$name] = $value;
        return $this;
    }

    /**
     * @return array
     * @throws Exception
     */
    public function runRemote($force_clean = false)
    {
        $expectedCode = 255;
        if (Helper::getConfig("unicode_emoji_fix")) {
            $cmd = $this->cmd();
            $task = TaskController::from([
                'name' => 'runRemote',
                'arg' => $cmd
            ]);
            $result = $task->start([$cmd], (rTask::FLG_DEFAULT & ~rTask::FLG_ECHO_CMD & ~rTask::FLG_STRIP_LOGS) | rTask::FLG_WAIT | rTask::FLG_DO_NOT_TRIM);
            $output = $result['log'];

            $expectedCode = $result['status'];
            ($force_clean || ($result['status'] == 0 && count($result['errors']) == 0))
            && rTask::clean(rTask::formatPath($task->id));
        } else {
            $output = RemoteShell::get()->execOutput($this, $expectedCode);
        }

        Helper::getConfig("debug") && FileUtil::toLog(__METHOD__ . ' DEBUG cmd ' . var_export([$this->cmd(), $output], true));

        return [$expectedCode, $output];
    }

    /**
     * @return array
     */
    public function getArgs(): array
    {
        return $this->args;
    }

// append a new arguments

    /**
     * @param array $args
     * @return ShellCmd
     */
    public function setArgs(array $args)
    {
        $this->args = $args;
        return $this;
    }

    public function addArgs(array $values = [])
    {
        foreach ($values as $value) {
            $this->args[] = $value;
        }
        return $this;
    }

    public function getArg($name)
    {
        return $this->args[$name];
    }
}