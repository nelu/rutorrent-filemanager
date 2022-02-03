<?php
use Flm\TaskController;
require_once(__DIR__ . '/boot.php');

$task = new TaskController($argv[1]);

$task->handle();
