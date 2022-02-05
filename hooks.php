<?php
require_once(__DIR__ . '/boot.php');


class filemanagerHooks
{

    public static function OnTaskSuccess($d) {
        $subject = 'File_'.$d["name"];
        rTorrentSettings::get()->pushEvent($subject, $d);
    }

    public static function OnTaskFail($d) {

    }
}
