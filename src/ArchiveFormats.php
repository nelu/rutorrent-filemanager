<?php

namespace Flm;

use Exception;
use Utility;

class ArchiveFormats
{

    public static $format_methods = [
        '7zipExtract' => '%s x -- %s'
    ];


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
            $cmd =  "{$params->binary} a -t{$stages[0]} ${password} -so -an -- @{$files_list} | {$params->binary} a -t{$stages[1]} {$compression} -si {$archive}";
        } else {
            $cmd = "{$params->binary} a ${password} {$compression} -- {$archive} @{$files_list}";
        }

        return $cmd;
    }

    public static function extractCmd( $params) {
        $archive = Helper::mb_escapeshellarg($params->file);
        return vsprintf(self::$format_methods['7zipExtract'], [
            $params->binary,
            $archive
        ]);
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

        $cmd = "{$params->binary} a -ep1 -m{$options->compression} -ol -v{$options->volume_size}";
        if (isset($params->options->password) && strlen($params->options->password) > 0) {
            $cmd .= ' -hp' . $options->password;
        }

        $cmd = $cmd . "- {$archive} @{$files_list}";

        return $cmd;
    }






}
