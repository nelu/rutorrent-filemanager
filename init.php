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

    $c = new WebController(Helper::getConfig());

    echo 'theWebUI.settings["webui.flm.config"] = '.json_encode($c->getConfig()) . ';';
    $theSettings->registerPlugin("filemanager");
}

