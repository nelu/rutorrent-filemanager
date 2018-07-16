<?php
namespace Flm;
use Flm\Helper;
use ReflectionMethod;
use RuntimeException;


// web controller
class WebController {

    public $flm;
    protected $config;
    protected $currentDirectory;

    public function __construct($config) {

        $this->config = $config;
    }

    public function handleRequest() {

        if (!isset($_POST['action'])) {

            die();
        }

        $this->currentDirectory = isset($_POST['dir']) ? $_POST['dir'] : '';

        $action = $_POST['action'];

        $call = json_decode($action, true);

        $call = $call ? $call : ['method' => $action];

        try {
            $this->flm = new \FLM($this->currentDirectory);

            $out = $this->_processCall((object)$call);

            Helper::jsonOut($out);

        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
        }

    }

    public function _getPostData($post_keys, $json = true) {
        $ret = array();
        foreach ($post_keys as $key => $err_code) {

            if (!isset($_POST[$key]) || ($json && !($files = json_decode($_POST[$key], true)))) {

                Helper::jsonError($err_code);
                return false;

            }

            $ret[$key] = $_POST[$key];
        }

        return $ret;

    }

  
    protected function _processCall($call) {

        $method = $call->method;

        if ((substr($method, 0, 1) == '_')) {
            throw new RuntimeException("Invalid method");
        }

        unset($call->method);

        $out = null;
        if (method_exists($this, $method)) {
            $reflectionMethod = new ReflectionMethod($this, $method);
            if (!$reflectionMethod->isPublic()) {

                throw new RuntimeException("Invalid method");
            }

            $out = call_user_func_array(array($this, $method), [$call]);
        } else
        {
            throw new RuntimeException("Invalid method");
        }

        return $out;
    }

  public function getConfig() {
      global $topDirectory;
      
      $archive = $this->config['archive'];
      $bins = [];

      $archive['types'] = [];

      $archive['compress'] = [];

      $i =0;
      foreach ($archive['type'] as $ext => $conf) {
          if(!isset($bins[$conf['bin']]))
          {
              $bins[$conf['bin']] = findEXE($conf['bin']);

          }
          if(!$bins[$conf['bin']])
          {
              $archive['type'][$ext] = false;
          }

          $archive['types'][] = $ext;
          $archive['compress'][$i] = $conf['compression'];
            $i++;
      }

    $settings['homedir'] = rtrim($topDirectory, DIRECTORY_SEPARATOR);
    $settings['mkdefmask'] = $this->config['mkdperm'];
    $settings['archives'] = $archive;

    return $settings;

  }
  
    public function taskLog($params) {

        try {
            $output = $this->flm->readTaskLogFromPos($params->target, $params->to);
        } catch (\Exception $err) {
            Helper::jsonError($err->getCode());
            return false;
        }

        $output['error'] = 0;

        return $output;
    }

    public function kill() {
        $e->kill($e->postlist['target']);
    }

    public function newDirectory($params) {

        if (!isset($params->target)) {
            Helper::jsonError(16);
        }
        try {

            $this->flm->mkdir($params->target);

        } catch (\Exception $err) {
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0];

    }

    public function fileDownload() {
        
        $data = $this->_getPostData(array( 'target' => 16), false);
        
        $sf = $this->flm->getWorkDir($data['target']);
        
        if (!sendFile($sf)) {
            cachedEcho('log(theUILang.fErrMsg[6]+" - ' . $sf . ' / "+theUILang.fErrMsg[3]);', "text/html");
        }
    }

    public function fileExtract($params) {


        if (!isset($params->to)) {
            Helper::jsonError(2);
        }

        if (!isset($params->target)) {
            Helper::jsonError(18);
        }

        try {
            $temp = $this->flm->extractFile(array('archive' => $params->target, 'to' => $params->to));
        } catch (\Exception $err) {
            Helper::jsonError($err->getCode());
            return false;
        }

        return array('error' => 0, 'tmpdir' => $temp['tok']);

    }

    public function fileMediaInfo() {

        $data = $this->_getPostData(array( 'target' => 16), false);

        try {
            $temp = $this->flm->mediainfo((object)$data);

        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
            return false;
        }

        return $temp;

    }

    public function fileRename($params) {

        
        if (!isset($params->to)) {
            Helper::jsonError(2);
        }

        if (!isset($params->target)) {
            Helper::jsonError(18);
        }

        try {
            $result = $this->flm->rename(array('from' => $params->target, 'to' => $params->to ));
        } catch (\Exception $err) {
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0];

    }

    public function fileScreenSheet($params) {
        

        
        if (!isset($params->to)) {
            Helper::jsonError(2);
        }

        if (!isset($params->target)) {
            Helper::jsonError(2);
        }

        try {
                    

        
            $temp = $this->flm->videoScreenshots($params->target, $params->to);

        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];
        
        
        $e->screenshots($e->postlist['target'], $e->postlist['to']);
    }

    public function filesCompress($params) {
        if (!isset($params->fls) || (count($params->fls) < 1)) {
            Helper::jsonError(22);
        }

        if (!isset($params->target)) {
            Helper::jsonError(16);
        }

        if (!isset($params->mode)) {
            Helper::jsonError(300);
        }

        try {

            $temp = $this->flm->archive($params);

        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];
    }

    public function filesCopy($params) {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            Helper::jsonError(22);
        }

        if (!isset($params->to)) {
            Helper::jsonError(2);
        }

        try {

            $temp = $this->flm->copy($params);
        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];
    }

    public function filesMove($params) {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            Helper::jsonError(22);
        }

        if (!isset($params->to)) {
            Helper::jsonError(2);
        }

        try {

            $temp = $this->flm->move($params);
        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];

    }

    public function filesRemove($params) {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            Helper::jsonError(22);
        }

        try {

            $temp = $this->flm->remove($params);
        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
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
            Helper::jsonError(2);
        }

        try {
            $temp = $this->flm->sfv_check($params);

        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];

    }

    public function sfvCreate($params) {

        if (!isset($params->fls) || (count($params->fls) < 1)) {
            Helper::jsonError(22);
        }
        if (!isset($params->target)) {
            Helper::jsonError(2);
        }

        try {
            $temp = $this->flm->sfvCreate($params);

        } catch (\Exception $err) {
            var_dump($err);
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'tmpdir' => $temp['tok']];

    }

    public function sess() {
        $e->get_session();
    }

    public function listDirectory($params) {

        try {
            $contents = $this->flm->dirlist($params);

        } catch (\Exception $err) {
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['listing' => $contents];
    }

    public function viewNfo($params) {

        if (!isset($params->mode)) {
            $params->mode = 0;
        }

        if (!isset($params->target)) {
            Helper::jsonError(2);
        }

        try {
            $contents = $this->flm->nfo_get($params->target, $params->mode);

        } catch (\Exception $err) {
            Helper::jsonError($err->getCode());
            return false;
        }

        return ['error' => 0, 'nfo' => $contents];

    }

}