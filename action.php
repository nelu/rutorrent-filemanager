<?php

use Flm\Helper;
use Flm\WebController;
$pluginDir = dirname(__FILE__);

require_once ($pluginDir . '/src/Helper.php');
require_once( dirname(__FILE__)."/../../php/util.php" );

require_once ($pluginDir . '/src/RemoteShell.php');
require_once ($pluginDir . '/src/Filesystem.php');
require_once ($pluginDir . '/src/Archive.php');
require_once ($pluginDir . '/src/WebController.php');

require_once ($pluginDir . '/../_task/task.php');

require_once (dirname(__FILE__) . DIRECTORY_SEPARATOR . 'init.php');

include ('flm.class.php');



$c = new WebController(Helper::getConfig());
$c->handleRequest();
