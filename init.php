<?php

use Flm\Helper;
use Flm\WebController;

$pluginDir = dirname(__FILE__);

require_once( dirname(__FILE__)."/../../php/util.php" );
require_once ($pluginDir . '/src/Helper.php');
require_once ($pluginDir . '/src/WebController.php');


$pluginConfig = Helper::getConfig();
if(function_exists('findRemoteEXE')) {
    //bootstrap

    $confBins = array_map(function ($v){ return $v['bin'];}, $pluginConfig['archive']['type']);
    if(in_array('zip', $confBins))
    {
        $confBins[] = 'unzip';
    }

    foreach ($confBins as $bin) {

        findRemoteEXE($bin, "thePlugins.get('filemanager').showError(\"theUILang.fErrMsg[24] +'" . $bin . "' \");", $remoteRequests);


        $info = $remoteRequests[$bin];

        $file = $info["path"].$bin.".found";


        if(!is_file($file) && isset($pluginConfig['archive']['type'][$bin]) )
            {
                unset($pluginConfig['archive']['type'][$bin]);
            }

    }


    $theSettings->registerEventHook($plugin["name"],"remove");
    $theSettings->registerPlugin("filemanager");

    $c = new WebController($pluginConfig);
    $jResult .= 'plugin.config = '.json_encode($c->getConfig()) . ';';
}

