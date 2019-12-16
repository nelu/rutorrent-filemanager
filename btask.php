<?php
use Flm\TaskController;
$pluginDir = dirname(__FILE__);
require_once $pluginDir . '/src/Helper.php';
require_once $pluginDir . '/src/FsUtils.php';
require_once $pluginDir . '/src/Archive.php';
require_once $pluginDir . '/src/SFV.php';
require_once $pluginDir . '/src/TaskController.php';
require_once( $pluginDir."/../../php/util.php" );


$task = new TaskController($argv[1]);

$task->handle();
