<?php


namespace Flm;


class ShellCmds
{
    public static function mkdir($target, $recursive = false, $mode = null): ShellCmd
    {
        return ShellCmd::bin('mkdir', ['-p' => $recursive, '--mode=' => $mode, $target]);
    }

    /**
     * @param $source
     * @param $to
     * @return ShellCmd
     */
    public static function recursiveCopy($source, $to): ShellCmd
    {
        return ShellCmd::bin('cp', ['-rp', $source, $to]);
    }

    public static function recursiveMove($file, $to): ShellCmd
    {
        return ShellCmd::bin('mv', ['-f', $file, $to]);
    }

    /**
     * @param $file
     * @return ShellCmd
     */
    public static function recursiveRemove($file): ShellCmd
    {
        return ShellCmd::bin('rm', ['-rf', $file])
            ->end('&& echo')->addArgs(['✓ ' . basename($file)]);
    }
}