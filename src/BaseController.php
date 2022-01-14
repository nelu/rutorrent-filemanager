<?php

namespace Flm;


use Exception;
use ReflectionMethod;
use RuntimeException;
use CachedEcho;

abstract class BaseController
{
    /**
     * @var FileManager
     */
    protected $flm;

    protected $config;
    protected $currentDirectory;

    public function __construct($config) {

        $this->config = $config;
    }

    public function handleRequest() {

        if (!isset($_POST['action'])) {

            self::jsonError('Invalid action');
        }

        $this->currentDirectory = isset($_POST['dir']) ? $_POST['dir'] : '';

        $action = $_POST['action'];

        $call = json_decode($action, true);

        $call = $call ? $call : ['method' => $action];

        try {
            $this->flm = new FileManager($this->currentDirectory);

            $out = $this->_processCall((object)$call);

            self::jsonOut($out);

        } catch (Exception $err) {
            self::jsonError(['code'=>$err->getCode(), 'msg'=> $err->getMessage()]);
        }

    }

    public function _getPostData($post_keys, $json = true) {
        $ret = array();
        foreach ($post_keys as $key => $err_code) {

            if (!isset($_POST[$key]) || ($json && !($files = json_decode($_POST[$key], true)))) {

                self::jsonError($err_code);
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

    public function flm() : FileManager
    {
        return $this->flm;
    }

    public static function jsonOut($data) {

        CachedEcho::send(json_encode($data), 'application/json', false );
    }

    public static function jsonError($errcode, $msg = 'Internal error') {
        self::jsonOut(['errcode' => $errcode, 'status' => 'ERROR', 'msg' => $msg]);
        die();
    }
}