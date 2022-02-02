<?php

global $pathToExternals;
// set with fullpath to binary or leave empty
$pathToExternals['rar'] = '';
$pathToExternals['7zip'] = '';

$config['mkdperm'] = 755; // default permission to set to new created directories
$config['show_fullpaths'] = false; // wheter to show userpaths or full system paths in the UI

$config['textExtensions'] = 'log|txt|nfo|sfv|xml|html';

// see what 7zip extraction supports as type by file extension
$config['fileExtractExtensions'] = '7z|bzip2|t?bz2|t?g|gz[ip]?|iso|img|lzma|rar|tar|t?xz|zip|z01|wim';

// archive creation, see archiver man page before editing
// archive.fileExt -> config
$config['archive']['type'] = [
    '7z' => [
        'bin' =>'7z',
        'compression' => [0, 5, 9],
    ],
    'rar' => [
        'bin' =>'rar',
        'compression' => range(0, 5),
    ]];

$config['archive']['type']['zip'] = $config['archive']['type']['7z'];
$config['archive']['type']['tar'] = $config['archive']['type']['7z'];
$config['archive']['type']['gzip'] = $config['archive']['type']['7z'];
$config['archive']['type']['tgz'] = $config['archive']['type']['7z'];
$config['archive']['type']['tar.bz2'] = $config['archive']['type']['7z'];
$config['archive']['type']['bzip2'] = $config['archive']['type']['7z'];


