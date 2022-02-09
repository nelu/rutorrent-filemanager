<?php

use Flm\Archive;
use Flm\P7zip;
use Flm\Rar;
use Flm\ShellCmd;
use Flm\ShellCmds;

if (!defined('STDOUT'))
{
    exit;
}

include 'boot.php';
$result = \Flm\FileChecksum::getFileHash('/tmp/tmpkj1fr22f');

var_dump( $result->run(), $result->cmd());

var_dump(

    ShellCmds::mkdir('/tmp/newdir', true, '0777')->run(),
    ShellCmd::bin('/bin/ls', ['-la', '/tmp/'])->end('|')->setArg('cat', true)->run()
);

//exit;
var_dump(
    Rar::unpack('myarchive.rar', '/tmp/')->setPassword("123")->cmd(),
    Rar::pack('myarchive.rar')
        ->setFileList('/tmp/filelist.txt')
        ->cmd(),
    // zip file
    Archive::compressCmd((object)[
        'type' => 'zip',
        'archive' => './mydir/myarchive.zip',
        'binary' => '7z',
        'fileList' => '/tmp/myarchive.zip_compress_list.txt',
        'password' => "123",
        'volumeSize' => 1024 * 1000,
        'compression' => 0
    ]),
    // tar.gz file
    Archive::compressCmd((object)[
        'type' => 'tar.gz',
        'multiplePass' => ['tar', 'gzip'],
        'archive' => './mydir/myarchive.tgz',
        'binary' => '7z',
        'fileList' => '/tmp/myarchive.tgz_compress_list.txt',
        // 'password' => "123", // not supported
        'volumeSize' => 1024 * 1000,
        'compression' => 0
    ]),
    // rar file
    Archive::compressCmd((object)[
        'type' => 'rar',
        'archive' => './mydir/myarchive.rar',
        'binary' => '/home/user/bin/rar',
        'fileList' => '/tmp/myarchive.rar_compress_list.txt',
        'password' => "123",
        'volumeSize' => 1024 * 1000,
        'compression' => 0
    ])
);