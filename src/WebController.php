<?php

namespace Flm;

use Exception;
use CachedEcho;
use SendFile;
use Throwable;

require_once dirname(__FILE__) . DIRECTORY_SEPARATOR . '/BaseController.php';

// web controller
class WebController extends BaseController
{

    public function getConfig()
    {
        global $topDirectory;

        $archive = [];
        $bins = [];

        $settings = [
            'textExtensions' => $this->config['textExtensions']
        ];

        foreach ($this->config['archive']['type'] as $ext => $conf) {
            $archive[$ext] = $conf;
        }

        $settings['homedir'] = rtrim($topDirectory, DIRECTORY_SEPARATOR);
        $settings['mkdefmask'] = $this->config['mkdperm'];
        $settings['archives'] = $archive;

        return $settings;
    }

    public function taskLog($params)
    {

        $output = $this->flm()->readTaskLogFromPos($params->target, $params->to);

        $output['error'] = 0;

        return $output;
    }

    public function kill()
    {
        //$e->kill($e->postlist['target']);
    }

    public function newDirectory($params)
    {

        if (!isset($params->target)) {
            self::jsonError(16);
        }

        $this->flm()->mkdir($params->target);

        return ['error' => 0];
    }

    public function fileDownload()
    {

        $data = $this->_getPostData(['target' => 16], false);

        $sf = $this->flm()->getWorkDir($data['target']);

        if (!SendFile::send($sf)) {
            CachedEcho::send('log(theUILang.fErrMsg[6]+" - ' . $sf . ' / "+theUILang.fErrMsg[3]);', "text/html");
        }
    }


    public function fileMediaInfo()
    {

        $data = $this->_getPostData(['target' => 16], false);
        $temp = $this->flm()->mediainfo((object)$data);

        return $temp;
    }

    public function fileRename($params)
    {

        if (!isset($params->to)) {
            self::jsonError(2);
        }

        if (!isset($params->target)) {
            self::jsonError(18);
        }

        $this->flm()->rename(['from' => $params->target, 'to' => $params->to]);

        return ['error' => 0];
    }

    public function filesCompress($params)
    {
        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        if (!isset($params->target)) {
            self::jsonError(16);
        }

        if (!isset($params->mode)) {
            self::jsonError(300);
        }

        try {

            $temp = $this->flm()->archive($params);

        } catch (Exception $err) {
            var_dump($err->getTraceAsString(), $params);

            self::jsonError($err->getCode(), $err->getMessage());

            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];
    }

    public function filesExtract($params)
    {

        if (!isset($params->to)) {
            self::jsonError(2);
        }
        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        $temp = $this->flm()->extractFile(['archives' => $params->fls, 'to' => $params->to]);


        return ['error' => 0, 'tmpdir' => $temp[0]['tok']];
    }


    public function filesCopy($params)
    {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        if (!isset($params->to)) {
            self::jsonError(2);
        }

        $temp = $this->flm()->copy($params);

        return ['error' => 0, 'tmpdir' => $temp['tok']];
    }

    public function filesMove($params)
    {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        if (!isset($params->to)) {
            self::jsonError(2);
        }

        $temp = $this->flm()->move($params);


        return ['error' => 0, 'tmpdir' => $temp['tok']];
    }

    public function filesRemove($params)
    {
        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        $task = $this->flm()->remove($params);

        return $task;
    }

    public function checkPostTargetAndDestination()
    {

        return $this->_getPostData(['target' => 18, 'to' => 18], false);
    }

    public function checkPostSourcesAndDestination()
    {

        return $this->_getPostData(['fls' => 22, 'to' => 2], false);
    }

    public function svfCheck($params)
    {

        if (!isset($params->target)) {
            self::jsonError(2);
        }


        $temp = $this->flm()->sfvCheck($params);


        return ['error' => 0, 'tmpdir' => $temp['tok']];
    }

    public function sfvCreate($params)
    {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }
        if (!isset($params->target)) {
            self::jsonError(2);
        }

        $temp = $this->flm()->sfvCreate($params);

        return ['error' => 0, 'tmpdir' => $temp['tok']];
    }

    public function sess()
    {
        // $e->get_session();
    }

    public function listDirectory($params)
    {
        $contents = $this->flm()->dirlist($params);
        return ['listing' => $contents];
    }

    public function viewNfo($params)
    {

        if (!isset($params->mode)) {
            $params->mode = 0;
        }

        if (!isset($params->target)) {
            self::jsonError(2);
        }

        $contents = $this->flm()->nfo_get($params->target, $params->mode);

        return ['error' => 0, 'nfo' => $contents];
    }

}