<?php
use Flm\TaskController;
require_once(__DIR__ . '/boot.php');
require_once (__DIR__ . '/../_task/task.php');

$task = new TaskController($argv[1]);

$task->handle();
