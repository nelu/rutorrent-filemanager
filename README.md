# rutorrent-filemanager
rTorrent file management plugin for ruTorrent webUI running with shell/javascript/php

Javascript web client with php endpoint with file operations methods

#### Features:
- support for file operations: copy/move/delete/rename
- hotkeys for copy/move actions (ctrl/cmd-c/x/v)
- integrated operations in torrent Files tab
- using twigjs for views
- sfv checksum functionality 
- text/nfo viewer, with configurable text extensions 
- archive unpack functionality, with configurable file extensions

#### Configuration
```php
// if archive binaries are not in $PATH, set the fullpath
$pathToExternals['rar'] = '';
$pathToExternals['p7zip'] = '';

$config['textExtensions'] = 'txt|nfo|sfv|xml|html';
// see what p7zip extraction supports as type by file extension
$config['fileExtractExtensions'] = '7z|bzip2|t?bz2|t?g|gz[ip]?|iso|img|lzma|rar|tar|t?xz|zip|z01|wim';

// archive type extension and binary for new archive
$config['archive']['type'] = [
    '7z' => [
        'bin' =>'p7zip',
        'compression' => [0, 5, 9],
    ],
    'rar' => [
        'bin' =>'rar',
        'compression' => range(0, 5),
    ]];

// using 7z for zip file creation
$config['archive']['type']['zip'] = $config['archive']['type']['7z'];
```

See these additional filemanager plugins for extended functionality:


- [filemanager-media](https://github.com/nelu/rutorrent-filemanager-media): Media view and screenshots
- [filemanager-share](https://github.com/nelu/rutorrent-filemanager-share): File sharing functionality

Feel free to contribute with commits and docs

TODO:
- fully migrate the archive related functionality to 7zip
- implement listeners for operation events (move, rename, delete)
