<?php

namespace Flm;

use Exception;
use Utility;

class ArchiveFormats
{

    public static $format_methods = [
        '7zipExtract' => '%s e -- %s',
    ];


    public static function sevenZipCompress($params) {
        $options = $params->options;
        $files_list = Helper::mb_escapeshellarg($params->filelist);
        $archive = Helper::mb_escapeshellarg($params->archive);
//        $compression = trim($options['comp'], '-');
        $compression = 5;

        $type = isset($params->type) ? '-t'.$params->type : '';

        return "{$params->binary} a ${type} -mx${compression} -- {$archive} @{$files_list}";
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
