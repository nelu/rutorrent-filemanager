<?php

namespace Flm;

use Exception;
use Utility;

class ArchiveFormats
{

    public static $format_methods = [
        'tar' => 'tarExtractCmd',
        'tar.gz' => 'tgzExtractCmd',
        'gz' => 'tgzExtractCmd',
        'tgz' => 'tgzExtractCmd',
        'zip' => 'zipExtractCmd',
        'rar' => 'rarExtractCmd',
        'bzip2' => 'bzipExtractCmd',
        'bzip' => 'bzipExtractCmd',
        'bz2' => 'bzipExtractCmd',
        'tar.bz2' => 'bzipExtractCmd'
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


    public static function getArchiveCompressCmd($args)
    {

        $params = clone $args;
        $ext = $params->options->type;

        $config = Helper::getConfig();
        $method_name = 'sevenZipCompress';

        if ($ext  == 'rar') {
            $method_name = 'rarCompressCmd';
        }


        //$method_name = str_replace('Extract', 'Compress', $format_methods[$ext]);
        $cmd = call_user_func_array([
            __CLASS__,
            $method_name
        ], [$params]);


        return $cmd;
    }

    public static function getArchiveExtractCmd($args)
    {

        $params = clone $args;
        $format_methods = self::$format_methods;

        $cmd = false;

        $ext = pathinfo($params->file, PATHINFO_EXTENSION);

        if (isset($format_methods[$ext])) {

            $method_name = $format_methods[$ext];
            $cmd = call_user_func_array([
                __CLASS__,
                $method_name
            ], [$params]);

        }

        return $cmd;
    }

    public static function zipCompressCmd($params)
    {

        $options = $params->options;
        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);
        $compression = trim($options->compression, '-');

        $cmd = <<<CMD
{$params->binary} -y -r -{$compression}
CMD;

        if (isset($options->password)) {
            $cmd .= ' -P ' . Helper::mb_escapeshellarg($options->password);
        }
        return $cmd . " {$archive} {$files}";
    }

    public static function zipExtractCmd($params)
    {

        $paths = (object)Helper::escapeCmdArgs($params);

        return <<<CMD
{$params->binary} -o {$paths->file} -d {$paths->to}
CMD;
    }

    public static function tgzCompressCmd($params)
    {

        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);
        $workdir = Helper::mb_escapeshellarg($params->options->workdir);

        return <<<CMD
{$params->binary} -C {$workdir} -czvf {$archive} {$files}
CMD;
    }

    public static function tgzExtractCmd($params)
    {

        $paths = (object)Helper::escapeCmdArgs($params);

        return <<<CMD
{$params->binary} -xzvf {$paths->file} -C {$paths->to}
CMD;

    }

    public static function tarExtractCmd($params)
    {

        $paths = (object)Helper::escapeCmdArgs($params);
        return <<<CMD
{$params->binary} -xvf {$paths->file} -C {$paths->to}
CMD;

    }

    public static function tarCompressCmd($params)
    {

        //$paths = (object)Helper::escapeCmdArgs($params);

        $options = $params->options;
        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);
        $workdir = Helper::mb_escapeshellarg($params->options->workdir);

        return <<<CMD
{$params->binary} -C {$workdir} -cvf {$archive} {$files}
CMD;
    }

    public static function rarExtractCmd($params)
    {

        $paths = (object)Helper::escapeCmdArgs($params);
        return <<<CMD
{$params->binary} x -ol -p- -or- {$paths->file} {$paths->to}
CMD;

    }

    public static function rarCompressCmd($params)
    {

        $options = (object)Helper::escapeCmdArgs($params->options);
        $files_list = Helper::mb_escapeshellarg($params->filelist);
        $archive = Helper::mb_escapeshellarg($params->archive);

        $cmd = "{$params->binary} a -ep1 -m{$options->compression} -ol {$options->multif} -v{$options->volume}";
        if (isset($options->password)) {
            $cmd .= ' -hp' . $options->password;
        }

        $cmd = $cmd . "- {$archive} @{$files_list}";

        return $cmd;
    }

    public static function bzipExtractCmd($params)
    {
        $paths = (object)Helper::escapeCmdArgs($params);

        return <<<CMD
{$params->binary} -xjvf  {$paths->file} -C {$paths->to}
CMD;

    }

    public static function bzipCompressCmd($params)
    {

        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);
        $workdir = Helper::mb_escapeshellarg($params->options->workdir);

        return "{$params->binary} -C {$workdir} -cjvf {$archive} {$files}";
    }

    public static function isoExtractCmd($params)
    {
        return "{$params->binary} x -bd -y -o {$params->to} {$params->file}";
    }


    public static function getExtractBinary($file)
    {

        switch (pathinfo($file, PATHINFO_EXTENSION)) {
            case 'rar':
                $bin = 'rar';
                break;
            case 'zip':
                $bin = 'unzip';
                break;
            case 'iso':
                $bin = 'unzip';
                break;
            case 'tar':
            case 'bz2':
            case 'gz':
                $bin = 'tar';
                break;
            default:
                $bin = false;
        }

        return $bin;

    }

    public static function getBin($archive_file, $compress = false)
    {
        if ($compress) {
            $type = pathinfo($archive_file, PATHINFO_EXTENSION);

            switch ($type) {

                case 'gzip':
                case 'tar':
                case 'gz':
                case 'bzip2':
                case 'bz2':
                case 'zip':
                    $formatBin = '7z';
                    break;
                case 'rar':
                    $formatBin = 'rar';
                    break;
                default:
                    throw new Exception("Unsupported archive format " . $type, 16);

            }
        } else {
            $formatBin = self::getExtractBinary($archive_file);

        }

        if (!$formatBin) {
            throw new Exception("Error Processing Request", 18);
        }

        return Utility::getExternal($formatBin);

    }

}
