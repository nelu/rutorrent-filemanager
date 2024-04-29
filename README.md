# rutorrent-filemanager
ruTorrent file management plugin with a javascript user interface running on rTorrent bittorrent client

### Features
- supported file operations: copy, move, delete, rename, archive, extract, checksum, view, file info
- file checksum functionality with multiple alogorithms supported: sfv, sha256
- text/nfo viewer, with configurable text extensions 
- archive file support, with configurable formats
- using 7zip for archive related and file checksum operations
- option to run all operations as chroot user
- virtual jailed home dir support
- using twigjs for views
- integrated menu in Files tab
- hotkey shortcuts for file operations: copy (ctrl+c), move (ctrl+x), paste (ctrl+v), delete, rename (F2)

### Configuration
#### Text Viewer
You can specify what file extensions are supported for viewing files as text:
```php
$config['textExtensions'] = 'log|txt|nfo|sfv|xml|html';
```
#### Archives
Currently the plugin supports handling archive files with 7zip and rar (non free). 
All archive manipulation is done with the use of 7zip, while rar is used ONLY for creation.
 
The paths for each archive util can be configured by changing with a value suited for your linux distribution in `conf.php`:
```php
// sample config for debian based
$pathToExternals['rar'] = '';
$pathToExternals['7zip'] = '/usr/bin/7z';
```
For a hint on how to add support for rar [see this](https://github.com/nelu/rutorrent-dock/blob/5357bd94bfc026ff0a6645501487ac140d7a92fe/src/build/Dockerfile#L48)

Since all extraction is handled by 7zip, you can specify which file extensions are available for extraction using a regex syntax:
```php
// see what 7zip extraction supports as type by file extension
$config['fileExtractExtensions'] = '7z|bzip2|t?bz2|t?g|gz[ip]?|iso|img|lzma|rar|tar|t?xz|zip|z01|wim';
```
See what archive formats your 7zip supports with: `7z i`

Configuration for creating different archive formats is done by specifing each archive extension with its configuration:
```php
// archive type extension and binary for new archive
$config['archive']['type'] = [
    '7z' => [
        'bin' =>'7zip',
        'compression' => [0, 5, 9],
    ],
    'rar' => [
        'bin' =>'rar',
        'compression' => range(0, 5),
    ]];

// using 7z for zip file creation
$config['archive']['type']['zip'] = $config['archive']['type']['7z'];
```
In the example above we are adding `.zip` archive support (as extension) by using the same config as for `.7z`

The `'bin'` value must a be a valid `$pathToExternals` key, ex: 
```php
$pathToExternals['7zip']
...
        'bin' =>'7zip',
```
See these additional filemanager plugins for extended functionality:


- [filemanager-media](https://github.com/nelu/rutorrent-filemanager-media): Media view and screenshots
- [filemanager-share](https://github.com/nelu/rutorrent-filemanager-share): File sharing functionality

Feel free to contribute with feature suggestions, fixes and documentation

TODO:
- enable more file checksum algos
