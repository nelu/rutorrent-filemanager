<?php

use Flm\Helper;
use Flm\WebController;

require_once(__DIR__ . '/boot.php');
$c = new WebController(Helper::getConfig());
$c->handleRequest();
