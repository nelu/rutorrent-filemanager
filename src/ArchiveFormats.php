<?php

namespace Flm;


class ArchiveFormats
{


    public static function sevenZipCompress($params) {
        $options = $params->options;
        $files_list = Helper::mb_escapeshellarg($params->filelist);
        $archive = Helper::mb_escapeshellarg($params->archive);

        $compression = "-mx{$options->compression}";
        $password  = (isset($options->password) && strlen($options->password) > 0)
            ? '-p'.Helper::mb_escapeshellarg($options->password)
            : '';

        if(!empty($options->multi_passes))
        {
            $stages = $options->multi_passes;
            $cmd =  "{$params->binary} a -bsp1 -t{$stages[0]} ${password} -so -an -- @{$files_list} | {$params->binary} a -t{$stages[1]} {$compression} -si {$archive}";
        } else {
            $cmd = "{$params->binary} a -bsp1 ${password} {$compression} -- {$archive} @{$files_list}";
        }

        return $cmd;
    }

    public static function extractCmd($params) {
        $cmd = [$params->binary, 'x', '-y'];

        if(isset($params->password))
        {
            $cmd[] = '-p'.Helper::mb_escapeshellarg($params->password);
        }
        $cmd[] = '-o'.Helper::mb_escapeshellarg($params->to);

        $cmd[] = '--';
        $cmd[] = Helper::mb_escapeshellarg($params->file);

        return implode(" ", $cmd);
    }

    public static function getArchiveCompressCmd($args)
    {
        $params = clone $args;
        $ext = $params->options->type;

        if ($ext  == 'rar') {
            $cmd = self::rarCompressCmd($params);
        } else {
            $cmd = self::sevenZipCompress($params);
        }

        return $cmd;
    }


    public static function rarCompressCmd($params)
    {
        $options = (object)Helper::escapeCmdArgs($params->options);
        $files_list = Helper::mb_escapeshellarg($params->filelist);
        $archive = Helper::mb_escapeshellarg($params->archive);

        $cmd = [$params->binary, 'a', '-ep1', "-m{$options->compression}", "-ol", "-v{$options->volume_size}"];

        if(isset($params->options->password))
        {
            $cmd[] = '-hp'.$options->password;
        }

        $cmd[] = '--';
        $cmd[] = $archive;
        $cmd[] = "@{$files_list}";

        return implode(" ", $cmd);
    }

}
