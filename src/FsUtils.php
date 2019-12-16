<?php
namespace Flm;

class FsUtils {

    public static $format_methods = array(
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
    );

    public static function getCopyCmd($source, $to) {
        $source = Helper::mb_escapeshellarg($source);
        $to = Helper::mb_escapeshellarg($to);
      /*  $source = escapeshellarg($source);
        $to = escapeshellarg($to);*/
        return <<<CMD
cp -rpv {$source} {$to} 
CMD;

    }

    public static function getRemoveCmd($file) {
        $file = Helper::mb_escapeshellarg($file);
        return <<<CMD
rm -rf {$file} 
CMD;

    }

    public static function getArchiveCompressCmd($args) {

        $params = clone $args;
        $format_methods = self::$format_methods;

        $cmd = false;

        $ext = pathinfo($params->archive, PATHINFO_EXTENSION);

        //$params->options->type

        $config = Helper::getConfig();

        if($params->options->type == 'bzip2') {
            $ext = $params->options->type;
        }

        if (isset($format_methods[$ext])) {

            $method_name = str_replace('Extract', 'Compress', $format_methods[$ext]);
            $cmd = call_user_func_array(array(
                __CLASS__,
                $method_name
            ), array($params));
            // var_dump($cmd);

        }

        return $cmd;
    }

    public static function getArchiveExtractCmd($args) {

        $params = clone $args;
        $format_methods = self::$format_methods;

        $cmd = false;

        $ext = pathinfo($params->file, PATHINFO_EXTENSION);

        if (isset($format_methods[$ext])) {

            $method_name = $format_methods[$ext];
            $cmd = call_user_func_array(array(
                __CLASS__,
                $method_name
            ), array($params));
            // var_dump($cmd);

        }

        return $cmd;
    }

    public static function zipCompressCmd($params) {

        $options = $params->options;
        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);
        $compression = trim($options->comp, '-');

        $cmd = <<<CMD
{$params->binary} -y -r -{$compression}
CMD;

        if(isset($options->password))
        {
            $cmd .= ' -P ' . Helper::mb_escapeshellarg($options->password);
        }
        return $cmd . " {$archive} {$files}";
    }

    public static function zipExtractCmd($params) {

        $paths = (object)Helper::escapeCmdArgs($params);

        return <<<CMD
{$params->binary} -o {$paths->file} -d {$paths->to}
CMD;
    }

    public static function tgzCompressCmd($params) {

        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);
        $workdir = Helper::mb_escapeshellarg($params->options->workdir);

        return <<<CMD
{$params->binary} -C {$workdir} -czvf {$archive} {$files}
CMD;
    }
    
    public static function tgzExtractCmd($params) {

        $paths = (object)Helper::escapeCmdArgs($params);

        return <<<CMD
{$params->binary} -xzvf {$paths->file} -C {$paths->to}
CMD;

    }

    public static function tarExtractCmd($params) {

        $paths = (object)Helper::escapeCmdArgs($params);
        return <<<CMD
{$params->binary} -xvf {$paths->file} -C {$paths->to}
CMD;

    }

    public static function tarCompressCmd($params) {

        //$paths = (object)Helper::escapeCmdArgs($params);

        $options = $params->options;
        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);
        $workdir = Helper::mb_escapeshellarg($params->options->workdir);
        
        return <<<CMD
{$params->binary} -C {$workdir} -cvf {$archive} {$files}
CMD;
    }

    public static function rarExtractCmd($params) {

        $paths = (object)Helper::escapeCmdArgs($params);
        return <<<CMD
{$params->binary} x -ol -p- -or- {$paths->file} {$paths->to}
CMD;

    }

    public static function rarCompressCmd($params) {

        $options = (object)Helper::escapeCmdArgs($params->options);
        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);

        $cmd = "{$params->binary} a -ep1 -m{$options->comp} -ol {$options->multif} -v{$options->volume}";
        if(isset($options->password))
        {
            $cmd .= ' -hp' . $options->password;
        }

        $cmd =  $cmd . "- {$archive} {$files}";

        return $cmd;
    }

    public static function bzipExtractCmd($params) {
        $paths = (object)Helper::escapeCmdArgs($params);

        return <<<CMD
{$params->binary} -xjvf  {$paths->file} -C {$paths->to}
CMD;

    }

    public static function bzipCompressCmd($params) {

        $files = implode(' ', (array)Helper::escapeCmdArgs($params->files));
        $archive = Helper::mb_escapeshellarg($params->archive);
        $workdir = Helper::mb_escapeshellarg($params->options->workdir);
        
        return <<<CMD
{$params->binary} -C {$workdir} -cjvf {$archive} {$files}
CMD;
    }

    public static function isoExtractCmd($params) {
        return <<<CMD
{$params->binary} x -bd -y -o {$params->to} {$params->file}
CMD;

    }

}
