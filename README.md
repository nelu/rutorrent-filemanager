# rutorrent-filemanager
rTorrent file management plugin for ruTorrent webUI running with shell/javascript/php
Javascript web client with php endpoint with file operations methods

***UI:***
- multiple file support for basic file operations: copy/move/delete/archive/sfv create
- hotkeys for copy/move actions (ctrl/cmd-c/x/v)
- using twigjs for views
- async js load for dialogs: archive, extract

Modal dialogs (false) support not fully supported: New Directory, NFO View
Write operations are UI blocking (modal=true), mostly multiple file operations are ui blocking (modal=true)

Additional filemanager plugins:
- filemanager-media: Media view and screenshots - see: https://github.com/nelu/rutorrent-filemanager-media
- filemanager-share: Share functionality - see: https://github.com/nelu/rutorrent-filemanager-share

Feel fee to contribute with commits and docs
