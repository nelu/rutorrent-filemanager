<?php
if(!defined('STDOUT'))
{
    exit;
}

include 'boot.php';

var_dump(
\Flm\ShellCmds::mkdir('/tmp/newdir', true, '0777')

);

//exit;
var_dump(
    \Flm\Rar::unpack('myarchive.rar', '/tmp/')->setPassword("123")->cmd(),
    \Flm\Rar::pack('myarchive.rar')
        ->setFileList('/tmp/filelist.txt')
        ->cmd(),
    // zip file
    \Flm\Archive::compressCmd((object)[
        'type' => 'zip',
        'archive' => './mydir/myarchive.zip',
        'binary' => '7z',
        'fileList' => '/tmp/myarchive.zip_compress_list.txt',
        'password' => "123",
        'volumeSize' => 1024*1000,
        'compression' => 0
    ]),
    // tar.gz file
    \Flm\Archive::compressCmd((object)[
        'type' => 'tar.gz',
        'multiplePass' => ['tar', 'gzip'],
        'archive' => './mydir/myarchive.tgz',
        'binary' => '7z',
        'fileList' => '/tmp/myarchive.tgz_compress_list.txt',
       // 'password' => "123", // not supported
        'volumeSize' => 1024*1000,
        'compression' => 0
    ]),
    // rar file
    \Flm\Archive::compressCmd((object)[
        'type' => 'rar',
        'archive' => './mydir/myarchive.rar',
        'binary' => '/home/user/bin/rar',
        'fileList' => '/tmp/myarchive.rar_compress_list.txt',
        'password' => "123",
        'volumeSize' => 1024*1000,
        'compression' => 0
    ])
);