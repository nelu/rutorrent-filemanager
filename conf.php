<?php

global $pathToExternals;
// set with fullpath to binary or leave empty
$pathToExternals['rar'] = '';
$pathToExternals['zip'] = '';
$pathToExternals['unzip'] = '/usr/bin/unzip';
$pathToExternals['tar'] = '';


$config['mkdperm'] = 755; 		// default permission to set to new created directories
$config['show_fullpaths'] = false; // wheter to show userpaths or full system paths in the UI


$config['textExtensions'] = 'log|txt|nfo|sfv|xml|html';
// archive mangling, see archiver man page before editing
// archive.fileExt -> config
$config['archive']['type'] = [
    'rar' => [  'bin' =>'rar',
                'compression' => range(0, 5),
    ],
    'zip' => [
        'bin' =>'zip',
        'compression' => ['-0', '-1', '-9'],
        ],
    'tar' => [
        'bin' =>'tar',
        'compression' => [0, 'gzip', 'bzip2'],
    ]
];

