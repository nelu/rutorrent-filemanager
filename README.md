# rutorrent-filemanager
rTorrent file management plugin for ruTorrent webUI running with shell/javascript/php
Javascript web client with php endpoint with file operations methods

***UI:***
- support for file operations: copy/move/delete/rename
- hotkeys for copy/move actions (ctrl/cmd-c/x/v)
- integrated operations in torrent Files tab
- using twigjs for views
- sfv checksum functionality 
- text/nfo viewer, with configurable text extensions in conf.php
``
$config['textExtensions'] = 'txt|nfo|sfv|xml|html';
``
- file archive support for extract/create operations

See these additional filemanager plugins for extended functionality:
- filemanager-media: Media view and screenshots - see: https://github.com/nelu/rutorrent-filemanager-media
- filemanager-share: Share functionality - see: https://github.com/nelu/rutorrent-filemanager-share

Feel free to contribute with commits and docs

TODO:
- fix utf8 files paths for RAR compression
- remove rar multipart format option in create dialog
- implement listeners for operation events (move, rename, delete)
