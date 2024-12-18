<?php

global $pathToExternals;
// set with fullpath to binary or leave empty
$pathToExternals['rar'] = '';
$pathToExternals['7zip'] = '/usr/bin/7z';

$config['debug'] = false;

// slower workaround using rTask to support unicode emoji characters.
// temporary till it gets fixed in rtorrent upstreams
// issue: https://github.com/rakshasa/rtorrent/pull/1309
// set to false for utf8 with no emoji chars support
$config['unicode_emoji_fix'] = true;

$config['mkdperm'] = 755; // default permission to set to new created directories

// see what 7zip i supports for hashers
$config['checksumExtensions'] = [
    "CRC32" => 'sfv',
    "SHA256" => 'sha256sum'
];

$config['extensions'] = [
    'checksum' => $config['checksumExtensions'],
    'text' => 'log|txt|nfo|xml|html|' . implode("|", $config['checksumExtensions']),
    // see what 7zip extraction supports as type by file extension
    'fileExtract' => '(7z|bzip2|t?bz2|tgz|gz(ip)?|iso|img|lzma|rar|tar|t?xz|zip|z01|wim)(\.[0-9]+)?'
];

// archive creation, see archiver man page before editing
// archive.fileExt -> config
$config['archive']['type'] = [
    '7z' => [
        'bin' => '7zip',
        'compression' => [1, 5, 9],
    ],
    'rar' => [
        'bin' => 'rar',
        'compression' => [0, 3, 5],
       // 'wrapper' => \Flm\Rar::class
    ]];

$config['archive']['type']['zip'] = $config['archive']['type']['7z'];
$config['archive']['type']['tar'] = $config['archive']['type']['7z'];
$config['archive']['type']['tar']['has_password'] = false;
$config['archive']['type']['bz2'] = $config['archive']['type']['tar'];
$config['archive']['type']['gz'] = $config['archive']['type']['tar'];
$config['archive']['type']['tar.7z'] = $config['archive']['type']['tar'];
$config['archive']['type']['tar.bz2'] = $config['archive']['type']['tar'];
$config['archive']['type']['tar.gz'] = $config['archive']['type']['tar'];
$config['archive']['type']['tar.xz'] = $config['archive']['type']['tar'];


// multiple passes for archiving and compression
$config['archive']['type']['tar.gz']['multipass'] = ['tar', 'gzip'];
$config['archive']['type']['tar.bz2']['multipass'] = ['tar', 'bzip2'];
$config['archive']['type']['tar.7z']['multipass'] = ['tar', '7z'];
$config['archive']['type']['tar.xz']['multipass'] = ['tar', 'xz'];
