<?php

namespace Flm;

use CachedEcho;
use SendFile;

// web controller
class WebController extends BaseController
{

    public function getConfig()
    {
        global $topDirectory;

        $archive = [];

        $settings = [
            'homedir' => rtrim($topDirectory, DIRECTORY_SEPARATOR),
            'extensions' => $this->config['extensions'],
            'debug' => $this->config['debug'],
            'mkdefmask' => $this->config['mkdperm']
        ];

        foreach ($this->config['archive']['type'] as $ext => $conf) {
            $archive[$ext] = $conf;
        }

        $settings['archives'] = $archive;

        return $settings;
    }

    public function newDirectory($params)
    {
        if (!isset($params->target)) {
            self::jsonError(16, $params->target);
        }

        return ['error' => !$this->flm()->newDir($params->target)];
    }

    public function fileDownload()
    {

        $data = $this->_getPostData(['target' => 16], false);

        $sf = $this->flm()->getFsPath($data['target']);

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

        $res = $this->flm()->rename((object)
        [
            'file' => $params->target,
            'to' => $params->to
        ]);

        return ['error' => !$res];
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

        $task = $this->flm()->archive($params);

        return $task;
    }

    public function filesExtract($params)
    {
        !isset($params->to) && self::jsonError(2);
        (!isset($params->fls) || (count($params->fls) < 1)) && self::jsonError(22);

        return $this->flm()->extractFiles($params->fls, $params->to, $params->options);
    }

    public function filesCopy($params)
    {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        if (!isset($params->to)) {
            self::jsonError(2);
        }

        $task = $this->flm()->copy($params);

        return $task;
    }

    public function filesMove($params)
    {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        if (!isset($params->to)) {
            self::jsonError(2);
        }

        $task = $this->flm()->move($params);

        return $task;
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

    public function checksumVerify($params)
    {

        if (!isset($params->target)) {
            self::jsonError(2);
        }

        $task = $this->flm()->checksumVerify($params);

        return $task;
    }

    public function checksumCreate($params)
    {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }
        if (!isset($params->target)) {
            self::jsonError(2);
        }

        $task = $this->flm()->checksumCreate($params);

        return $task;
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