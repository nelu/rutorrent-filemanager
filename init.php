<?php

use Flm\Helper;
use Flm\WebController;

$pluginDir = dirname(__FILE__);

require_once( $pluginDir."/boot.php" );


$pluginConfig = Helper::getConfig();
if(function_exists('findRemoteEXE')) {
    //bootstrap

    $confBins = array_map(function ($v){ return $v['bin'];}, $pluginConfig['archive']['type']);

    foreach (array_unique($confBins) as $bin) {

        findRemoteEXE($bin, "thePlugins.get('filemanager').showError(\"theUILang.fErrMsg[24] +'" . $bin . "' \");", $remoteRequests);


        $info = $remoteRequests[$bin];

        $file = $info["path"].$bin.".found";


        if(!is_file($file) && isset($pluginConfig['archive']['type'][$bin]) )
            {
                unset($pluginConfig['archive']['type'][$bin]);
            }

    }

    $theSettings->registerEventHook($plugin["name"],"TaskSuccess", 10, true);
    $theSettings->registerPlugin("filemanager");

    $c = new WebController($pluginConfig);
    $jResult .= 'plugin.config = '.json_encode($c->getConfig()) . ';';
}

