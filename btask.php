<?php

use Flm\TaskController;

require_once(__DIR__ . '/boot.php');

$task = new TaskController();

$task->handle($argv) || exit(1);
