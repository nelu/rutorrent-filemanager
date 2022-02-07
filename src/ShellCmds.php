<?php


namespace Flm;


class ShellCmds
{
    public static function mkdir($target, $recursive = false, $mode = null) : ShellCmd
    {
        return ShellCmd::from('mkdir', ['-p' => $recursive, '--mode=' => $mode, $target]);
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
}