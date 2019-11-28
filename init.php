<?php

use Flm\Helper;
use Flm\WebController;

$pluginDir = dirname(__FILE__);

require_once( dirname(__FILE__)."/../../php/util.php" );
require_once ($pluginDir . '/src/Helper.php');
require_once ($pluginDir . '/src/WebController.php');


if(function_exists('findRemoteEXE')) {
    //bootstrap
    foreach (((object)Helper::getConfig())->archive['type'] as $conf) {
        findRemoteEXE($conf['bin'], "thePlugins.get('filemanager').showError(\"theUILang.fErrMsg[24] +'" . $conf['bin'] . "' \");", $remoteRequests);
    }

    $theSettings->registerPlugin("filemanager");

    $c = new WebController(Helper::getConfig());
    $jResult .= 'plugin.config = '.json_encode($c->getConfig()) . ';';
}

