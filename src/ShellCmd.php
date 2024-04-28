<?php


namespace Flm;


use Exception;

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
     * @param $bin
     * @param array $args
     * @return ShellCmd
     */
    public static function bin($bin, $args = []): ShellCmd
    {
        return (new static($bin))->setArgs($args);
    }

    /**
     * @param string $bin
     * @return string|P7zip
     */
    public function binary(string $bin = '')
    {
        if (!empty($bin))
        {
            $this->binary = $bin;
            return $this;
        }
        return $this->binary;
    }

    /**
     * @param bool $asArray
     * @return string|array
     * @throws Exception
     */
    public function cmd($asArray = false)
    {
        if (empty($this->binary))
        {
            throw new Exception("Command binary not set");
        }

        $formatted_args = [];
        //compile arguments
        array_walk($this->args, function (&$item, $key) use (&$formatted_args) {
            $r = null;
            // null is disabled
            if (!is_null($item))
            {

                if (is_int($key))
                {
                    // exclude numeric keys value from arg value
                    $key = '';
                }
                if (is_bool($item) && $item === true)
                {
                    $r = $key;
                } elseif (is_string($item))
                {
                    // trim spaces from positional/no name arguments
                    $r = ltrim($key, " ") . Helper::mb_escapeshellarg($item);
                } elseif (is_int($item))
                {
                    // int we hope
                    $r = $key . $item;
                }

                if (!is_null($r))
                {
                    $formatted_args[] = $r;
                }
            }
        });

        $cmd = array_merge([$this->binary], $formatted_args);

        return $asArray ? $cmd : implode(" ", $cmd);
    }

    /**
     * @return array
     * @throws Exception
     */
    public function run()
    {
        $cmd = $this->end('2>&1')->cmd();
        exec($cmd, $output, $exit);
        return [$exit, $output];
    }

    /**
     * @return array
     * @throws Exception
     */
    public function runRemote()
    {
        $expectedCode = 255;
        $output = RemoteShell::get()->execOutput($this, $expectedCode);

        return [$expectedCode, $output];
    }

    /** Set the command input/output: | > &
     * When $outputArg is empty it will remove the argument
     * @param string $outputArg
     * @return ShellCmd
     */
    public function end($outputArg = '')
    {
        if (is_string($outputArg) && !empty($outputArg))
        {
            unset($this->args[$outputArg]);
            $this->setArg($outputArg, true);
            $this->endAt = $outputArg;
        } elseif (isset($this->endAt))
        {
            // remove end or update position
            unset($this->args[$this->endAt]);
            $this->endAt = null;
        }

        return $this;
    }

    /**
     * @return array
     */
    public function getArgs(): array
    {
        return $this->args;
    }

    /**
     * @param array $args
     * @return ShellCmd
     */
    public function setArgs(array $args)
    {
        $this->args = $args;
        return $this;
    }

// append a new arguments
    public function addArgs(array $values = [])
    {
        foreach ($values as $value)
        {
            $this->args[] = $value;
        }
        return $this;
    }

    public function setArg(string $name, $value)
    {
        $this->args[$name] = $value;
        return $this;
    }

    public function getArg($name)
    {
        return $this->args[$name];
    }
}