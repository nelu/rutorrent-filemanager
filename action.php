<?php

use Flm\Helper;
use Flm\WebController;

require_once(__DIR__ . '/boot.php');
require_once (__DIR__ . '/../_task/task.php');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$c = new WebController(Helper::getConfig());
$c->handleRequest();
