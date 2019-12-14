<?php
namespace Flm;
use Exception;

require_once dirname(__FILE__) . DIRECTORY_SEPARATOR . '/BaseController.php';
// web controller
class WebController extends BaseController {

  public function getConfig() {
      global $topDirectory;
      
      $archive = [];
      $bins = [];

      $settings = [
          'textExtensions' => $this->config['textExtensions']
      ];

      foreach ($this->config['archive']['type'] as $ext => $conf) {
          if(!isset($bins[$conf['bin']]))
          {
              $bins[$conf['bin']] = findEXE($conf['bin']);
          }
          if(!$bins[$conf['bin']])
          {
              $archive[$ext] = false;
          } else {
              $archive[$ext] = $conf;
          }
      }

    $settings['homedir'] = rtrim($topDirectory, DIRECTORY_SEPARATOR);
    $settings['mkdefmask'] = $this->config['mkdperm'];
    $settings['archives'] = $archive;

    return $settings;

  }
  
    public function taskLog($params) {

        try {
            $output = $this->flm()->readTaskLogFromPos($params->target, $params->to);
        } catch (Exception $err) {
            self::jsonError($err->getCode());
            return false;
        }

        $output['error'] = 0;

        return $output;
    }

    public function kill() {
        //$e->kill($e->postlist['target']);
    }

    public function newDirectory($params) {

        if (!isset($params->target)) {
            self::jsonError(16);
        }
        try {

            $this->flm()->mkdir($params->target);

        } catch (Exception $err) {
            self::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0];

    }

    public function fileDownload() {
        
        $data = $this->_getPostData(array( 'target' => 16), false);
        
        $sf = $this->flm()->getWorkDir($data['target']);
        
        if (!sendFile($sf)) {
            cachedEcho('log(theUILang.fErrMsg[6]+" - ' . $sf . ' / "+theUILang.fErrMsg[3]);', "text/html");
        }
    }

    public function fileExtract($params) {


        if (!isset($params->to)) {
            self::jsonError(2);
        }

        if (!isset($params->target)) {
            self::jsonError(18);
        }

        try {
            $temp = $this->flm()->extractFile(array('archive' => $params->target, 'to' => $params->to));
        } catch (Exception $err) {
            self::jsonError($err->getCode());
            return false;
        }

        return array('error' => 0, 'tmpdir' => $temp['tok']);

    }

    public function fileMediaInfo() {

        $data = $this->_getPostData(array( 'target' => 16), false);

        try {
            $temp = $this->flm()->mediainfo((object)$data);

        } catch (Exception $err) {
            self::jsonError($err->getCode(), $err->getMessage());
           // var_dump($err->getTraceAsString());
            return false;
        }

        return $temp;

    }

    public function fileRename($params) {

        
        if (!isset($params->to)) {
            self::jsonError(2);
        }

        if (!isset($params->target)) {
            self::jsonError(18);
        }

        try {
            $result = $this->flm()->rename(array('from' => $params->target, 'to' => $params->to ));
        } catch (Exception $err) {
            self::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0];

    }



    public function filesCompress($params) {
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

    public function filesCopy($params) {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        if (!isset($params->to)) {
            self::jsonError(2);
        }

        try {

            $temp = $this->flm()->copy($params);
        } catch (Exception $err) {
            var_dump($err);
            self::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];
    }

    public function filesMove($params) {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        if (!isset($params->to)) {
            self::jsonError(2);
        }

        try {

            $temp = $this->flm()->move($params);
        } catch (Exception $err) {
            var_dump($err);
            self::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];

    }

    public function filesRemove($params) {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }

        try {

            $temp = $this->flm()->remove($params);
        } catch (Exception $err) {
            var_dump($err);
            self::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];

    }

    public function checkPostTargetAndDestination() {

        return $this->_getPostData(array('target' => 18, 'to' => 18), false);

    }

    public function checkPostSourcesAndDestination() {

        return $this->_getPostData(array('fls' => 22, 'to' => 2), false);

    }

    public function svfCheck($params) {

        if (!isset($params->target)) {
            self::jsonError(2);
        }

        try {
            $temp = $this->flm()->sfv_check($params);

        } catch (Exception $err) {
            var_dump($err);
            self::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];

    }

    public function sfvCreate($params) {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            self::jsonError(22);
        }
        if (!isset($params->target)) {
            self::jsonError(2);
        }

        try {
            $temp = $this->flm()->sfvCreate($params);

        } catch (Exception $err) {
            var_dump($err);
            self::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];

    }

    public function sess() {
       // $e->get_session();
    }

    public function listDirectory($params) {

        try {
            $contents = $this->flm()->dirlist($params);

        } catch (Exception $err) {
            self::jsonError($err->getCode());
            return false;
        }

        return ['listing' => $contents];
    }

    public function viewNfo($params) {

        if (!isset($params->mode)) {
            $params->mode = 0;
        }

        if (!isset($params->target)) {
            self::jsonError(2);
        }

        try {
            $contents = $this->flm()->nfo_get($params->target, $params->mode);

        } catch (Exception $err) {
            self::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'nfo' => $contents];

    }

}