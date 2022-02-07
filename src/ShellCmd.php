<?php


namespace Flm;


use Exception;

class ShellCmd
{
    protected $binary = '';
    protected $args = [];

    /**
     * ShellCmd constructor.
     * @param string $binary
     */
    public function __construct(string $binary)
    {
        $this->bin($binary);
    }

    /**
     * @param string $bin
     * @return string|P7zip
     */
    public function bin(string $bin = '')
    {
        if (!empty($bin)) {
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
        if (empty($this->bin())) {
            throw new Exception("Command binary not set");
        }

        $formatted_args = [];
        //compile arguments
        array_walk($this->args, function (&$item, $key) use (&$formatted_args) {
            $r = null;
            // null is disabled
            if (!is_null($item)) {

                if(is_int($key))
                {
                    // exclude numeric keys value from arg value
                    $key = '';
                }
                if (is_bool($item) && $item === true) {
                    $r = $key;
                } elseif (is_string($item) && $item != "") {
                    // skip empty string argument values
                    // trim spaces from positional/no name arguments
                    $r = trim($key, " ") . Helper::mb_escapeshellarg($item);
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
    public function setArgs(array $args): ShellCmd
    {
        $this->args = $args;
        return $this;
    }

    public function setArg(string $name, $value)
    {
        $this->args[$name] = $value;
        return $this;
    }

    public function getArg(string $string)
    {
        return $this->args[$string];
    }

    /**
     * @param $bin
     * @param array $args
     * @return ShellCmd
     */
    public static function from($bin, $args = [])
    {
        return (new static($bin))->setArgs($args);
    }
}