<?php

global $pathToExternals;
// set with fullpath to binary or leave empty
$pathToExternals['rar'] = '';
$pathToExternals['zip'] = '';
$pathToExternals['unzip'] = '/usr/bin/unzip';
$pathToExternals['tar'] = '';



$config['tempdir'] = '/tmp';		// path were to store temporary data ; must be writable
$config['mkdperm'] = 755; 		// default permission to set to new created directories
$config['show_fullpaths'] = false; // wheter to show userpaths or full system paths in the UI


// archive mangling, see archiver man page before editing
// archive.fileExt -> config
$config['archive']['type'] = [
    'rar' => [  'bin' =>'rar',
                'compression' => range(0, 5),
    ],
    'zip' => [
        'bin' =>'unzip',
        'compression' => ['-0', '-1', '-9'],
        ],
    'tar' => [
        'bin' =>'tar',
        'compression' => [0],
    ]
];

$config['archive']['type']['gzip'] = $config['archive']['type']['bzip2'] = $config['archive']['type']['tar'];

