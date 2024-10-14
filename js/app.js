(function (global) {

    function FileManagerUtils() {
        let utils = {
            perm_map: ['-', '-xx', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']
        };

        utils.isArchive = function (element) {
            var re = new RegExp('('
                + flm.config.fileExtractExtensions
                + ')$', "i");

            return this.basename(element).match(re);
        };

        utils.isDir = function (element) {
            return (element.charAt(element.length - 1) === '/');
        };

        utils.logSystem = function (component) {
            let logMsg = '';

            component = component || 'filemanager';

            for (var i = 1; i < arguments.length; i++) {
                logMsg += arguments[i];
            }
            log(component + ': '+ logMsg);
        };

        utils.logError = function (errcode, extra, component) {

            if (!$type(extra)) {
                extra = '';
            }

            // take 0 as valid error code
            if ($type(errcode)) {
                let codeMsg = $type(theUILang.fErrMsg[errcode])
                    ? theUILang.fErrMsg[errcode]
                    : errcode;

                flm.utils.logSystem(component, codeMsg,  " -> ", extra);
            }

        };

        utils.formatPermissions = function (octal) {

            var map = this.perm_map;
            var arr = octal.split('');

            var out = '';

            for (var i = 0; i < arr.length; i++) {
                out += map[arr[i]];
            }
            return out;

        };

        utils.formatDate = function (timestamp, format) {

            if (timestamp) {

                var d = new Date(timestamp * 1000);

                var times = {
                    s: d.getSeconds(),
                    m: d.getMinutes(),
                    h: d.getHours(),

                    d: d.getDate(),
                    M: d.getMonth(),
                    y: d.getFullYear()
                };

                for (i in times) {
                    if (i === 'M') {
                        times[i]++;
                    }
                    if (times[i] < 10) {
                        times[i] = "0" + times[i];
                    }
                }

                return format.replace(/%([dMyhms])/g, function (m0, m1) {
                    return times[m1];
                });
            } else {
                return '';
            }
        };

        utils.hasDir = function (entries) {
            var hasDirs = false;
            $.each(entries, function (k, v) {
                if (window.flm.utils.isDir(v)) {
                    hasDirs = true;
                    return false;

                }

            });

            return hasDirs;
        };

        utils.getICO = function (element) {

            if (this.isDir(element)) {
                return ('Icon_Dir');
            }

            var iko = 'flm-sprite ';

            switch (this.getExt(element).toLowerCase()) {

                case 'mp3' :
                    iko += 'sprite-mp3';
                    break;
                case 'avi':
                case 'mp4':
                case 'wmv':
                case 'mkv':
                case 'divx':
                case 'mov':
                case 'flv':
                case 'mpeg':
                    iko += 'sprite-video';
                    break;
                case 'bmp':
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                    iko += 'sprite-image';
                    break;
                case 'log':
                case 'txt':
                case 'nfo':
                    iko += 'sprite-nfo';
                    break;
                case 'sfv':
                    iko += 'sprite-sfv';
                    break;
                /*                    case 'rar':
                                        iko += 'sprite-rar';
                                        break;
                                    case 'zip':
                                        iko += 'sprite-zip';
                                        break;*/
                case 'torrent':
                    iko += 'sprite-torrent';
                    break;
                default:
                    if (flm.utils.isArchive(element)) {
                        iko += 'sprite-zip';
                    } else {
                        iko = 'Icon_File';
                    }
            }


            return (iko);
        };

        utils.getExt = function (element) {

            if (!$type(element)) {
                return '';
            }

            var ext = element.split('.').pop();
            var valid = (element.split('.').length > 1) && ext.match(/^[A-Za-z0-9]{2,5}$/);

            ext = valid ? ext : '';

            return ext.toLowerCase();
        };

        utils.basedir = function (path) {

            var last = '';
            path = this.trimslashes(path);

            if (path) {
                var ar = path.split('/');
                ar.pop();
                last += ar.join('/');
                if (ar.length > 0) {
                    last += '/';
                }
            }

            return '/' + last;
        };

        utils.stripBasePath = function (path, basepath) {
            var t = this.trimslashes(path).split(this.trimslashes(basepath));

            var relative = path;

            if (t.length > 1) {
                relative = t[1];
            }

            return relative;
        };


        utils.json_encode = function (obj) {
            var self = this;
            var s = '';
            switch ($type(obj)) {
                case "number":
                    return (String(obj));
                case "boolean":
                    return (obj ? "1" : "0");
                case "string":
                    return ('"' + obj + '"');
                case "array": {
                    s = '';
                    $.each(obj, function (key, item) {
                        if (s.length)
                            s += ",";
                        s += self.json_encode(item);
                    });
                    return ("[" + s + "]");
                }
                case "object": {
                    s = '';
                    $.each(obj, function (key, item) {
                        if (s.length)
                            s += ",";
                        s += ('"' + key + '":' + self.json_encode(item));
                    });
                    return ("{" + s + "}");
                }
            }
            return ("null");
        };

        utils.rtrim = function (str, char) {
            if (!$type(str)) {
                return str;
            }
            // handles one char
            char = char && char[0] || ' ';

            var lastIndexOfChar = 0;

            for (var i = str.length - 1; i >= 0; i--) {
                if (str[i] === char) {
                    lastIndexOfChar = i;
                } else {
                    break;
                }
            }

            return lastIndexOfChar ? str.slice(0, lastIndexOfChar)
                : str;
        };

        utils.ltrim = function (str, char) {
            if (!$type(str)) {
                return str;
            }
            // handles one char
            char = char && char[0] || ' ';

            var lastIndexOfChar = 0;

            for (var i = 0; i < str.length; i++) {
                if (str[i] === char) {
                    lastIndexOfChar = i + 1;
                } else {
                    break;
                }
            }

            return str.slice(lastIndexOfChar)

        };

        utils.addslashes = function (str) {
            // http://phpjs.org/functions/addslashes:303
            return (str + '').replace(/[\\"\/]/g, '\\$&').replace(/\u0000/g, '\\0');
        };

        utils.isValidPath = function (what) {
            what = what || '';
            //starts with /
            return (what.split('/').length > 1);
        }

        utils.basename = function (what) {
            return utils.trimslashes(what).split('/').pop();
        };

        utils.replaceFilePath = function (newPath, oldPath, ext, forceExtension = false) {
            let fileDir = this.basedir(newPath);
            let fileName =  this.basename(newPath);

            if(oldPath)
            {
                if(this.isDir(newPath)) {
                    fileDir = newPath;
                    fileName = !this.isDir(oldPath) ? this.basename(oldPath) : '';
                }

                fileName = ext
                    ? this.stripFileExtension(fileName, [ext]) + (forceExtension ? '.' + forceExtension : '')
                    : fileName;
            } else {
                fileName = flm.ui.browser.recommendedFileName(ext, forceExtension);
            }

            return this.buildPath([fileDir, fileName]);
        };

        utils.buildPath = function (parts) {

            var res = [];
            var item;
            var endingSlash = false;
            for (var i = 0; i < parts.length; i++) {
                item = parts[i];
                item = utils.trimslashes(item);
                if (item !== "") {
                    endingSlash = utils.isDir(parts[i]);
                    res.push(item);
                }
            }
            var ret = '/' + res.join('/');
            if (endingSlash) {
                ret += '/';
            }
            return ret;

        };
        utils.trimslashes = function (str) {

            if (!$type(str)) {
                return '';
            }

            var ar = str.split('/');
            var rar = [];

            for (var i = 0; i < ar.length; i++) {
                if (ar[i]) {
                    rar.push(ar[i]);
                }
            }

            return (rar.join('/'));
        }

        utils.stripFileExtension = function (currentPath, exts) {
            var file;
            var fileName = flm.utils.basename(currentPath);

            if ($type(exts)) {
                // debugger;
                file = fileName.replace(new RegExp('\.(' + exts + ')$', "i"), "");
            } else {
                var parts = fileName.split('.');
                parts.pop();
                file = parts.join('.');
            }

            return file;
        }

        return utils;
    }
    const FileManagerViews = function (viewPath) {

        var self = {};
        self.viewsPath = viewPath;
        self.namespaces = {'flm': self.viewsPath + '/'};

        const utils = FileManagerUtils();

        for (var funcName in utils) {
            if ($type(utils[funcName]) === "function") {
                Twig.extendFunction(funcName, utils[funcName]);
            }
        }

        self.getView = function (name, options, fn) {

            options = options || {};
            var filename = name + '.twig';

            options.views = options.views || 'flm';
            options.theUILang = theUILang;
            options.utils = flm.utils;
            options.settings = {
                'twig options': {
                    namespaces: self.namespaces,
                    name: filename,
                    href: filename
                }
            };

            if ($type(options.async)) {
                options.settings['twig options'].allow_async = options.async;
            }

            return Twig.renderFile(undefined, options, function (dumb, template) {
                $type(fn) && fn(template);
            });
        };

        return self;

    };
    const userInterface = function () {

        var self = {};
        self.settings = {
            defaults: {
                "showhidden": true,
                "histpath": 5,
                "timef": '%d-%M-%y %h:%m:%s',
                "permf": 1,
                "cleanlog": false,
                "arcnscheme": 'new',
                "scrows": 12,
                "sccols": 4,
                "scwidth": 300
            },
            getSettingValue: function (name) {
                return $type(theWebUI.settings["webui.flm.settings." + name])
                    ? theWebUI.settings["webui.flm.settings." + name]
                    : this.defaults[name];
            },

            getSettings: function () {

                var all = {};

                $.each(self.settings.defaults, function (i) {
                    all[i] = self.settings.getSettingValue(i);
                });

                return all;
            },
            // plugin config tab in UI settings
            onShow: function () {
                if (!$('#flm-settings-pane').length) {
                    // load view
                    flm.views.getView(flm.views.viewsPath + '/' + 'settings-pane',
                        {'opts': this.getSettings()},
                        function (view) {
                            flm.getPlugin()
                                .attachPageToOptions($('<div id="flm-settings-pane">'+view+'</div>').get(0), theUILang.fManager);

                            $(document).trigger(flm.EVENTS.settingsShow, view);
                        }
                    );
                } else {
                    $(document).trigger(flm.EVENTS.settingsShow);
                }
            },
            onSave: function () {
                var needsave = false;

                $('#flm-settings-pane').find('input,select').each(function (index, ele) {
                    var inid = $(ele).attr('id').split('flm-settings-opt-')[1];
                    var inval = $(ele).attr('type') === 'checkbox'
                        ? $(ele).is(':checked')
                        : $(ele).val();

                    if (inval !== self.settings.getSettingValue(inid)) {
                        theWebUI.settings["webui.flm.settings." + inid] = inval;
                        needsave = true;
                    }
                });

                if (needsave) {
                    theWebUI.save();
                    flm.Refresh();
                }
            }
        };

        var fsBrowser = function () {

            var browse = {
                tableEntryPrefix: "_flm_",
                uiTable: $('#flm-browser-table table'),
                clipaboardEvent: null,
                clipboardEntries: [],
                selectedEntries: [],
                selectedTarget: null,
                navigationLoaded: false
            };
            var isVisible = false;


            browse.uiTableFormat = function (table, arr) {
                    var i;
                    for (i = 0; i < arr.length; i++) {
                        if (arr[i] == null) {
                            arr[i] = '';
                        } else {
                            switch (table.getIdByCol(i)) {
                                case 'name':
                                    if (flm.ui.browser.isTopDir(arr[i])) {
                                        arr[i] = '../';
                                    }
                                    if (flm.utils.isDir(arr[i])) {
                                        arr[i] = flm.utils.trimslashes(arr[i]);
                                    }
                                    break;
                                case 'size' :
                                    if (arr[i] !== '') {
                                        arr[i] = theConverter.bytes(arr[i], 2);
                                    }
                                    break;
                                case 'type' :
                                    arr[i] = flm.utils.isDir(arr[i])
                                        ? ''
                                        : flm.utils.getExt(arr[i]);
                                    break;
                                case 'time' :
                                    arr[i] = flm.ui.formatDate(arr[i]);
                                    break;
                                case 'perm':
                                    if (self.settings.getSettingValue('permf') > 1) {
                                        arr[i] = flm.utils.formatPermissions(arr[i]);
                                    }
                                    break;
                            }
                        }
                    }
                    return arr;
            };
            var bindKeys = function () {
                var ctrlDown = false,
                    f2key = 113,
                    ctrlKey = 17,
                    cmdKey = 91,
                    vKey = 86,
                    xKey = 88,
                    cKey = 67;

                $(document).keydown(function (e) {
                    if (e.keyCode === ctrlKey || e.keyCode === cmdKey) ctrlDown = true;
                }).keyup(function (e) {
                    if (e.keyCode === ctrlKey || e.keyCode === cmdKey) ctrlDown = false;
                });

                $("#flm-browser-table").keydown(function (e) {
                    if (ctrlDown && (e.keyCode === vKey || e.keyCode === cKey || e.keyCode === xKey)) return false;
                });

                // Document Ctrl + C/V/X
                $(document).keydown(function (e) {

                    if (browse.isVisible() && theDialogManager.visible.length === 0) {
                        // only if the tab is visible and no dialogs are open

                        if (ctrlDown && (e.keyCode === cKey)) {
                            browse.handleKeyCopy();
                        }
                        if (ctrlDown && (e.keyCode === vKey)) {
                            browse.handleKeyPaste();
                        }
                        if (ctrlDown && (e.keyCode === xKey)) {
                            browse.handleKeyMove();
                        }

                        if (e.keyCode === f2key) {
                            browse.handleKeyRename();
                        }
                    }

                });

            };

            browse.init = function () {
                browse.updateUiTable();
                browse.setSorting();
                bindKeys();
                browse.loadNavigation();
            };

            browse.isVisible = function () {
                return isVisible;
            };

            // up dir path check
            browse.isTopDir = function (path) {
                var parentDir = flm.utils.basedir(flm.currentPath);
                return (path === parentDir);
            };

            browse.disableTable = function () {
                browse.uiTable.addClass('disabled_table');
            };
            browse.enableTable = function () {
                browse.uiTable.removeClass('disabled_table');
            };

            browse.disableRefresh = function () {
                $('#flm-nav-refresh').attr('disabled', true);
            };
            browse.enableRefresh = function () {
                $('#flm-nav-refresh').attr('disabled', false);
            };

            browse.fileExists = function (what) {

                var exists = false;
                what = flm.utils.basename(what);

                var checkInTable = function (path) {

                    try {
                        return (browse.table().getValueById(browse.tableEntryPrefix + path, 'name'));
                    } catch (dx) {
                        console.log(dx);
                    }

                    return exists;
                };

                return (checkInTable(what) || checkInTable(what + '/'));
            };

            browse.getSelectedEntry = function () {
                return browse.selectedTarget;
            };

            browse.getSelection = function (fullpath) {
                fullpath = fullpath || false;
                var selectedEntries = [];
                var rows = browse.table().rowSel;
                var entryName;
                for (var i in rows) {
                    entryName = i.split(browse.tableEntryPrefix)[1];
                    if ((!rows[i]) || browse.isTopDir(entryName)) {
                        continue;
                    }
                    if (fullpath) {
                        entryName = flm.getCurrentPath(entryName);
                    }
                    selectedEntries.push(entryName);
                }

                return selectedEntries;

            };

            browse.recommendedFileName = function (ext, desiredExt) {
                // use the current dir name as base if multiple files are selected
                desiredExt = desiredExt || ext
                let file = browse.selectedEntries.length > 1 && !browse.isTopDir(flm.getCurrentPath())
                    ? flm.getCurrentPath()
                    : browse.getSelectedEntry()

                file = ext ? flm.utils.stripFileExtension(file, ext) + '.' + desiredExt : '';
                return file;
            };

            browse.loadNavigation = function () {
                if (!browse.navigationLoaded) {
                    flm.views.getView(flm.views.viewsPath + '/' + 'table-header', {apiUrl: flm.api.endpoint},
                        function (view) {
                            browse.navigationLoaded = true;
                            var plugin = flm.getPlugin();
                            $('#' + plugin.ui.fsBrowserContainer).prepend(view);
                        }
                    );
                }
            };

            browse.onShow = function () {
                if (isVisible) {
                    return;
                }
                isVisible = true;


                if (!flm.currentPath) {
                    var table = browse.table();
                    if (table) {
                        flm.goToPath('/').then(function () {
                            theWebUI.resize();
                            $(document).trigger(flm.EVENTS.browserVisible, browse);
                        });

                        // display table columns
                        table.refreshRows();
                    }
                } else {
                    $(document).trigger(flm.EVENTS.browserVisible, browse);
                }

            };

            browse.onHide = function () {
                $('#fMan_showconsole').hide();
                isVisible = false;

            };

            // executed outside the browse/this scope
            browse.onSelectEntry = function (e, id) {

                var target = id.split(browse.tableEntryPrefix)[1];

                browse.selectedTarget = !browse.isTopDir(target) ? flm.getCurrentPath(target) : target;

                // handles right/left click events
                if ($type(id) && (e.button === 2)) {

                    theContextMenu.clear();
                    browse.selectedEntries = browse.getSelection(false);

                    var menuEntries = browse.getEntryMenu(browse.selectedTarget, browse.selectedEntries);
                    $(document).trigger(flm.EVENTS.entryMenu, [menuEntries, target]);

                    $.each(menuEntries, function (index, value) {
                        theContextMenu.add(value);
                    });

                    theContextMenu.show();
                } else {
                    // normal click - focus
                }
            };

            browse.handleKeyCopy = function () {
                browse.clipaboardEvent = 'copy';
                browse.clipboardEntries = browse.getSelection(true);
            };

            browse.handleKeyMove = function () {
                browse.clipaboardEvent = 'move';
                browse.clipboardEntries = browse.getSelection(true);
            };

            browse.handleKeyPaste = function () {
                if (browse.clipaboardEvent) {
                    browse.selectedEntries = browse.clipboardEntries;
                    browse.selectedTarget = null;
                    flm.ui.getDialogs().showDialog(browse.clipaboardEvent)
                }
            };

            browse.handleKeyRename = function () {
                if (browse.selectedEntries.length === 1
                    && browse.selectedTarget
                    && !browse.isTopDir(browse.selectedTarget))
                {
                    flm.ui.getDialogs().showDialog('rename')
                }
            };

            browse.onSetEntryMenu = function (call) {
                $(document).on(flm.EVENTS.entryMenu, function (e, menu, path) {
                    call(menu, path);
                });

            };

            browse.getEntryMenu = function (target, entries) {

                var utils = FileManagerUtils();
                var pathIsDir = utils.isDir(target);
                var flm = theWebUI.FileManager;
                var menu = [];

                menu.push([
                    theUILang.fOpen,
                    (entries.length > 1) ? null : function () {
                        browse.open(target);
                    }]);

                if (!browse.isTopDir(target)) {

                    var fext = utils.getExt(target);

                    var txtRe = new RegExp(flm.config.textExtensions);

                    if (fext.match(txtRe)) {
                        menu.push([theUILang.fView,
                            function () {
                                self.viewNFO(target);
                            }]);
                        menu.push([CMENU_SEP]);
                    }

                    // create submenu
                    var create_sub = [];

                    create_sub.push([theUILang.fcNewTor, thePlugins.isInstalled('create') && entries.length ? function () {

                        flm.manager.createTorrent(target);
                    } : null]);
                    create_sub.push([CMENU_SEP]);
                    create_sub.push([theUILang.fcNewDir, "flm.ui.getDialogs().showDialog('mkdir')"]);
                    create_sub.push([theUILang.fcNewArchive, "flm.ui.showArchive()"]);

                    if (!utils.hasDir(entries)) {
                        create_sub.push([CMENU_SEP]);
                        create_sub.push([theUILang.fcSFV, "flm.ui.showSFVcreate()"]);
                    }

                    menu.push([CMENU_CHILD, theUILang.fcreate, create_sub]);
                    menu.push([CMENU_SEP]);


                    menu.push([theUILang.fCopy, "flm.ui.getDialogs().showDialog('copy')"]);
                    menu.push([theUILang.fMove, "flm.ui.getDialogs().showDialog('move')"]);
                    menu.push([theUILang.fDelete, "flm.ui.getDialogs().showDialog('delete')"]);

                    if (!(entries.length > 1)) {
                        menu.push([theUILang.fRename, "flm.ui.getDialogs().showDialog('rename')"]);
                    }
                    menu.push([CMENU_SEP]);

                    if (utils.isArchive(target)) {

                        menu.push([theUILang.fExtracta, function () {
                            var archives = [];
                            var entry;
                            for (var i = 0; i < browse.selectedEntries.length; i++) {
                                entry = browse.selectedEntries[i];
                                utils.isArchive(entry) && archives.push(entry)
                            }
                            browse.selectedEntries = archives;

                            window.flm.ui.getDialogs().showDialog('extract');
                        }]);
                        menu.push([CMENU_SEP]);
                    }

                    (fext === 'sfv')
                    && menu.push([theUILang.fcheckSFV, "flm.ui.getDialogs().showDialog('sfv_check')"]);

                    (!pathIsDir && thePlugins.isInstalled('mediainfo'))
                    && menu.push([theUILang.fMediaI, function () {
                        flm.manager.doMediainfo(target);
                    }]);
                } else {
                    menu.push([theUILang.fcNewDir, "flm.ui.getDialogs().showDialog('mkdir')"]);
                }

                if (menu[menu.length - 1][0] !== CMENU_SEP) {
                    menu.push([CMENU_SEP]);
                }

                /*  menu.push(["Permissions", "flm.ui.showPermissions()"]);*/

                menu.push([theUILang.fRefresh, "flm.goToPath(flm.currentPath)"]);

                return menu;
            };

            // navigation
            browse.open = function (path) {
                if (flm.utils.isDir(path)) {
                    flm.goToPath(path);
                } else {
                    flm.getFile(path);
                }
            };

            // table
            browse.setSorting = function () {
                const table = browser.table();
                table.initialGetSortFunc = table.getSortFunc;
                table.getSortFunc = function (id, reverse, valMapping) {
                    const sortResult = table.initialGetSortFunc(id, reverse, valMapping);
                    sortFunction = function (x, y) {

                        //debugger;
                        var xVal = x.split(browse.tableEntryPrefix)[1];
                        var yVal = y.split(browse.tableEntryPrefix)[1];

                        if (flm.ui.browser.isTopDir(xVal) || flm.ui.browser.isTopDir(yVal)) {
                            return 1;
                        } else if (!flm.utils.isDir(xVal) && flm.utils.isDir(yVal)) {
                            return 1;
                        } else if (flm.utils.isDir(xVal) && !flm.utils.isDir(yVal)) {
                            return -1;
                        } else {
                            return sortResult(x, y);
                        }

                    }
                    return sortFunction;
                }
            };

            browse.getEntryHash = function (fileName) {
                return browse.tableEntryPrefix + fileName;
            };

            browse.setTableEntries = function (data) {

                var table = browse.table();

                table.clearRows();

                if (flm.currentPath !== '/') {
                    var path = flm.utils.basedir(flm.currentPath); // trailing slash required, its a dir
                    table.addRowById({
                            name: path,
                            size: '',
                            time: '',
                            type: '/',
                            perm: ''
                        },
                        browse.getEntryHash(path),
                        'flm-sprite flm-sprite-dir_up');
                } else {
                    if (data.length < 1) {
                        data = {
                            0: {
                                name: '/',
                                size: '',
                                time: '',
                                perm: ''
                            }
                        };
                    }
                }

                $.each(data, function (ndx, file) {

                    var ftype = flm.utils.isDir(file.name) ? 0 : 1;

                    var entry = {
                        name: file.name,
                        size: file.size,
                        time: file.time,
                        type: ftype + file.name,
                        perm: file.perm
                    };

                    var hash = browse.getEntryHash(file.name);

                    table.addRowById(entry, hash, flm.utils.getICO(file.name));

                    if (!flm.ui.settings.getSettingValue('showhidden') && (file.name.charAt(0) === '.')) {
                        table.hideRow(hash);
                    }
                });
                table.refreshRows();

            };

            browse.table = function () {
                return theWebUI.getTable("flm");
            };

            browse.updateUiTable = function () {
                var table = browse.table();

                table.renameColumnById('time', theUILang.fTime);
                table.renameColumnById('type', theUILang.fType);
                table.renameColumnById('perm', theUILang.fPerm);
            };

            return browse;
        };

        var browser = fsBrowser();

        // file operation dialogs
        var dialogs = {

            activeDialogs: {},
            onStartEvent: null,
            startedPromise: null,
            dirBrowser: {},
            // multiple file operations are ui blocking
            forms: {
                archive: {
                    modal: true,
                    pathbrowse: true,
                    template: "dialog-archive"
                },
                copy: {
                    modal: true,
                    pathbrowse: true,
                    template: "dialog-copy"
                },
                console: {
                    template: "dialog-console"
                },
                mkdir: {
                    modal: false,
                    template: 'dialog-new-dir'
                },
                move: {
                    modal: true,
                    pathbrowse: true,
                    template: "dialog-move"
                },
                delete: {
                    modal: true,
                    pathbrowse: false,
                    template: "dialog-delete"
                },
                extract: {
                    modal: true,
                    pathbrowse: true,
                    template: "dialog-extract"
                },
                permissions: {
                    modal: false,
                    template: "dialog-permissions"
                },
                rename: {
                    modal: true,
                    template: "dialog-rename"
                },
                sfv_check: {
                    modal: true,
                    template: "dialog-svf_check"
                },
                sfv_create: {
                    modal: true,
                    pathbrowse: true,
                    multiselectFilesOnly: true,
                    template: "dialog-svf_create"
                },
                nfo_view: {
                    modal: false,
                    template: "dialog-nfo_view"
                }
            },

            // common after event handle
            afterHide: function (dialogId, what) {

                if (this.dirBrowser.hasOwnProperty(dialogId)) {
                    for (var i = 0; i < this.dirBrowser[dialogId].length; i++) {
                        this.dirBrowser[dialogId][i].hide();
                        this.dirBrowser[dialogId][i].frame.remove();
                    }

                    this.dirBrowser[dialogId] = [];
                }

            },
            // common before event handle
            beforeShow: function (id, what) {
                var diags = this;
                var diagId = '#' + id;

                diags.getDialogHeader(diagId)
                    .empty()
                    .html(theUILang['flm_popup_' + what])
                    .prepend('<span class="flm-sprite-diag flm-sprite sprite-' + what + '"></span>');

                var config = this.forms[what];

                /*   if ($type(config.modal) && config.modal) {
                       theDialogManager.setModalState();
                   } else {
                       theDialogManager.clearModalState();
                   }*/


                var options = $type(config.options) ? config.options : {};
                options.apiUrl = flm.api.endpoint;
                options.selectedEntries = browser.selectedEntries;
//                options.selectedTarget = !browser.selectedTarget ? '/'  :flm.getCurrentPath(browser.selectedTarget);

                options.selectedTarget = !browser.selectedTarget ? '/' : browser.selectedTarget;
                options.currentPath = flm.getCurrentPath('/');

                flm.views.getView($type(config.options) ? config.template : flm.views.viewsPath + '/' + config.template, options,
                    function (html) {
                        var newContent = $(diagId + ' .flm_popup-content')
                            .html(html);

                        newContent.find('.flm-diag-cancel')
                            .click(function () {
                                dialogs.hide(diagId);
                            });

                        dialogs.disableStartButton();

                        newContent.find('.flm-diag-start').attr('disabled', false)
                            .click(function () {
                                if ($type(diags.onStartEvent) === "function") {
                                    dialogs.disableStartButton();
                                    dialogs.hide(diagId);

                                    diags.startedPromise = diags.onStartEvent.apply(diags, arguments);
                                    diags.startedPromise.then(function () {
                                            dialogs.hide(diagId);
                                        },
                                        function (data) {
                                            flm.utils.logError(data.errcode ? data.errcode : "", data.msg || data);
                                        });
                                }
                            });

                        diags.afterLoad(diagId, what);
                        $type(config.pathbrowse) && config.pathbrowse && diags.setDirBrowser(diagId);
                    }
                );

            },

            afterLoad: function (id, what) {
                setTimeout(function () {
                    flm.ui.dialogs.startButton().select().focus();
                });
            },

            startButton: function (diag) {
                diag = diag ? '#'+flm.utils.ltrim(diag, '#') : this.getDialogId(diag);
                return $(diag + ' .flm-diag-start');
            },
            disableStartButton: function (diag) {
                this.startButton(diag).attr('disabled', true);
            },
            enableStartButton: function (diag) {
                this.startButton(diag).attr('disabled', false);
            },

            getCheckedList: function (diag) {

                var list = [];

                diag = diag || this.getDialogId('window');
                var checks = $(diag + ' .checklist input:checked');

                checks.each(function (index, val) {
                    //list.push(flm.utils.addslashes(decodeURIComponent(val.value)));
                    list.push(decodeURIComponent(val.value));
                });

                return list;
            },

            getDialogId: function (formId) {
                formId = formId || 'window';

                return '#' + this.getTheDialogsId(formId);
            },

            getTheDialogsId: function (formId) {
                var config = dialogs.forms.hasOwnProperty(formId) ? dialogs.forms[formId] : {};

                return 'flm_popup_' + (!config.hasOwnProperty('modal') || config.modal ? 'modal_' : '') + formId;
            },

            getDialogHeader: function (diagId) {
                return $(diagId + "-header");
            },

            getTargetPath: function (container) {
                var ele = this.dirBrowserInput(container)
                return ele[0].tagName.toLowerCase() === 'input' ? ele.val() : ele.text();
            },
            hide: function (dialogId, afterHide) {
                dialogId = dialogId || 'window';
                dialogId = flm.utils.ltrim(dialogId, '#');

                theDialogManager.hide(dialogId, afterHide);

            },

            onStart: function (callback) {
                this.startedPromise = null;
                this.onStartEvent = callback;
            },

            show: function (dialogId, afterShow) {
                dialogId = dialogId || 'window';
                theDialogManager.show(flm.utils.ltrim(dialogId, '#'), afterShow);
            },

            updateTargetPath: function (container, path) {
                var ele = this.dirBrowserInput(container)
                return ele[0].tagName.toLowerCase() === 'input' ? ele.val(path) : ele.text(path);
            },

            dirBrowserInput: function (diagId) {
                diagId = '#'+flm.utils.ltrim(diagId, '#');
                return $(diagId + '.dlg-window .flm-diag-nav-path');
            },

            setDirBrowser: function (diagId) {
                var inputSelectors = $(diagId + ' .flm-diag-nav-path');
                for (var i = 0; i < inputSelectors.length; i++) {
                    if (thePlugins.isInstalled("_getdir")) {
                        new theWebUI.rDirBrowser(inputSelectors[i].id);
                    }
                }
            },

            //makeVisbile
            showDialog: function (what, viewEvents) {

                viewEvents = viewEvents || {};

                if (!this.forms.hasOwnProperty(what)) {
                    console.error('No such dialog configured: ', what);
                    return;
                }

                var config = this.forms[what];

                var modal = $type(config.modal) ? config.modal : true;

                var diagId = flm.utils.ltrim(this.getDialogId(!modal ? what : 'window'), '#');
                var diags = this;

                // create it
                if (!theDialogManager.items.hasOwnProperty(diagId)) {

                    theDialogManager.make(diagId,
                        '',
                        $('<div class="cont fxcaret flm_popup-content"></div>').get(0),
                        modal); // prevent the user from changing table selection by default

                }
                $.each(['beforeHide', 'beforeShow', 'afterHide', 'afterShow'], function (ndx, evName) {

                    theDialogManager.setHandler(diagId, evName, function (id) {
                        $type(diags[evName])
                        && diags[evName].apply(diags, [id, what]);

                        viewEvents.hasOwnProperty(evName)
                        && viewEvents[evName].apply(diags, [id, what]);

                    });

                });
                theDialogManager.show(diagId);

            }

        };


        self.console = {

            loader: thePlugins.isInstalled('create')
                ? 'create'
                : 'default',
            loaded: null,
            dialog: function () {
                return $(dialogs.getDialogId('console'));
            },

            writeConsole: function (text) {
                var promise = this.loaded ? this.loaded.promise() : this.show();

                return promise.then(
                    function () {
                        var console = self.console.dialog().find('#flm_popup_console-log-container');

                        if (browser.isIE) {
                            console.innerHTML = "<pre>" + console.html() + text + "</pre>";
                        } else {
                            console.find('pre').append(text);
                        }

                    }
                );
            },
            loadConsole: function (onLoaded) {
                var config = dialogs.forms['console'];
                var diagId = dialogs.getDialogId('console');
                diagId = flm.utils.ltrim(diagId, '#');

                if (self.console.loaded) {
                    return self.console.loaded.promise();
                }

                self.console.loaded = $.Deferred();
                if (!theDialogManager.items.hasOwnProperty(diagId)) {
                    // create it
                    flm.views.getView(flm.views.viewsPath + '/' + config.template, {}, function (html) {
                        theDialogManager.make(diagId, theUILang.flm_popup_console,
                            $(html).get(0),
                            config.modal); // prevent the user from changing table selection by default
                        dialogs.getDialogHeader('#' + diagId)
                            .prepend('<span class="flm-sprite-diag flm-sprite sprite-console"></span>');

                        $('#flm-diag-console-clear').click(function () {
                            self.console.clearlog();
                        });

                        theDialogManager.setHandler(diagId, 'beforeShow', function () {
                            $('#flm-diag-stop').click(function () {
                                self.console.logMsg(theUILang.fStops[theWebUI.FileManager.activediag] + "\n");
                                theWebUI.FileManager.logStop();

                            });
                        });

                        // can override handler above
                        self.console.loaded.resolve(diagId);
                        $type(onLoaded) && onLoaded();

                    });


                } else {
                    // triggering other later subscribtins
                    $type(onLoaded) && onLoaded();
                }

                return self.console.loaded.promise();
            },

            logMsg: function (text) {

                text = text + "\n";
                self.console.writeConsole(text).then(
                    function () {
                        var console = self.console.dialog().find('#flm_popup_console-log-container');
                        console[0].scrollTop = console[0].scrollHeight;
                    }
                );

            },

            clearlog: function () {
                return $('#flm_popup_console-log-container pre').empty();
            },

            show: function (msg, viewEvents) {
                var diagId = dialogs.getDialogId('console');

                return self.console.loadConsole().then(
                    function () {
                        // override previous callbacks
                        viewEvents = viewEvents || {};

                        /*             $.each(['beforeHide', 'beforeShow', 'afterHide', 'afterShow'], function (ndx, evName) {

                                         theDialogManager.setHandler(diagId, evName, function (id) {
                                             viewEvents.hasOwnProperty(evName)
                                             && viewEvents[evName].apply(diags, [id, what]);

                                         });

                                     });*/
                        $type(msg) && self.console.logMsg(msg);
                        theDialogManager.show(flm.utils.ltrim(diagId, '#'));
                    }
                );

            },

            showProgress: function () {
                return this.loadConsole().then(
                    function () {
                        self.console.dialog()
                            .find('.buttons-list').addClass("flm-sprite-loading-" + self.console.loader);
                    }
                )
            },
            hideProgress: function () {
                self.console.dialog()
                    .find('.buttons-list').removeClass("flm-sprite-loading-" + self.console.loader);
            }

        };

        // file operation dialogs
        self.dialogs = dialogs;
        self.getDialogs = function () {
            return dialogs;
        };

        self.init = function () {
            console.log('init', this);

            // file navigation
            self.initFileBrowser();

            // operation dialogs
            flm.getPlugin().ui.readyPromise.resolve(self);

        };

        self.disableNavigation = function () {
            self.browser.disableTable();
            self.browser.disableRefresh();
        };

        self.enableNavigation = function () {
            self.browser.enableTable();
            self.browser.enableRefresh();

        };

        self.formatDate = function (timestamp) {
            return flm.utils.formatDate(timestamp, this.settings.timef || '%d.%M.%y %h:%m:%s')
        };

        self.getPopupId = function (popupName) {
            return 'fMan_' + popupName;
        };

        self.initFileBrowser = function () {
            $('#tabbar').append('<input type="button" id="fMan_showconsole" class="Button" value="Console" style="display: none;">');
            $('#fMan_showconsole').click(function () {
                self.console.show();
            });
            // file navigation
            browser.init();
        };

        self.onSettingsShow = function (call) {
            $(document).on("flm.settingsOnShow", function (view) {
                call(view);
            });

        };

        self.showArchive = function () {
            return dialogs.showDialog('archive');
        };

        self.viewNFO = function (file) {
            file && (browser.selectedTarget = file);
            dialogs.showDialog('nfo_view');
        };

        self.showPermissions = function () {
            dialogs.showDialog('permissions');

        };

        self.showSFVcreate = function () {
            dialogs.showDialog('sfv_create', {
                afterShow: function () {
                }
            });
        };

        self.browser = browser;

        return self;

    };
    const manager = function() {
        let self =  {
            inaction: false,

            cleanactions: function () {

                $(".fMan_Stop").attr('disabled', true);
                clearTimeout(theWebUI.FileManager.actiontimeout);
                flm.ui.console.hideProgress();
                theWebUI.FileManager.activediag = '';
                theWebUI.FileManager.actionlist = {};
                theWebUI.FileManager.actionstats = 0;
                theWebUI.FileManager.actiontoken = 0;
                theWebUI.FileManager.actiontimeout = 0;
                theWebUI.FileManager.actionlp = 0;

            },

            stripJailPath: function (entry) {
                const path = flm.utils.stripBasePath(entry, flm.config.homedir) ;
                return flm.utils.isDir(entry) ? path + '/' : path;
            },

            addJailPath: function (entries) {
                let i;
                for (i = 0; i < entries.length; i++) {
                    entries[i] = flm.utils.buildPath([flm.config.homedir, this.stripJailPath(entries[i])]);
                }

                return entries;
            },

            getFullPaths: function (entries) {

                for (var i = 0; i < entries.length; i++) {
                    entries[i] = flm.getCurrentPath(this.stripJailPath(entries[i]));
                }

                return entries;
            },

            logStop: function () {

                flm.ui.console.hideProgress();
                this.action.request('action=kill&target=' + encodeURIComponent(theWebUI.FileManager.actiontoken));
                this.cleanactions();

                /*
                this.clearlog();
                        this.cmdlog("Fetching...");

                        var self = this;

                        this.makeVisbile('fMan_Console');
                        var loader = './images/ajax-loader.gif';
                        if (thePlugins.isInstalled('create')) {
                            loader = './plugins/create/images/ajax-loader.gif';
                        }
                        $('#fMan_Console .buttons-list').css("background", "transparent url(" + loader + ") no-repeat 15px 2px");
                        $(".fMan_Stop").attr('disabled', true);

                        this.action.request('action=minfo&target=' + encodeURIComponent(what), function(data) {
                            if (theWebUI.FileManager.isErr(data.errcode, what)) {
                                self.cmdlog('Failed fetching data');
                                return false;
                            }
                            self.clearlog();
                            self.cmdlog(data.minfo);
                        });

                                    flm.ui.console.hideProgress();*/
            },

            logAction: function (action, text) {
                flm.ui.console.show(action + ': ' + text);
            },

            logConsole: function (action, text) {
                flm.ui.console.logMsg(action + ': ' + text);
            },

            doMediainfo: function (target) {

                theWebUI.startConsoleTask("mediainfo", flm.getPlugin().name, {
                    'action': 'fileMediaInfo',
                    'target': target
                }, {noclose: true});

            }
        }

        self.createTorrent = function (target) {
            var relative = self.stripJailPath(target);
            var isRelative = (relative !== target);

            var path = self.addJailPath([isRelative ? relative : target])[0];

            $('#path_edit').val(path);

            if ($('#tcreate').css('display') === 'none') {
                theWebUI.showCreate();
            }
        }

        return self;
    }
    const apiClient = function (endpoint) {

        var client = {
            endpoint: endpoint,

            get: function (data) {
                return this.request('GET', data);
            },
            post: function (data) {
                return this.request('POST', data);
            },
            request: function (type, data) {
                type = type || 'GET';

                var deferred = $.Deferred();

                $.ajax({
                    type: type,
                    url: endpoint + '?_=' + Math.floor(Date.now() / 1000),
                    timeout: theWebUI.settings["webui.reqtimeout"],
                    async: true,
                    cache: false,
                    data: {action: flm.utils.json_encode(data)}, // encoded rest
                    //  contentType: "application/json",
                    dataType: "json",

                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        deferred.reject({'response': [XMLHttpRequest, textStatus, errorThrown]});
                    },
                    success: function (data) {
                        if (data.hasOwnProperty('errcode')
                            || (data.hasOwnProperty('error') && data.error)) {

                            deferred.reject(data);

                        } else {
                            deferred.resolve(data);
                        }
                    }
                });

                return deferred.promise();
            },

            promise: null

        };

        client.runTask = function (name, data) {
            var def = $.Deferred();
            var plugin = flm.getPlugin();
            data.workdir = flm.getCurrentPath();

            theWebUI.startConsoleTask(name, plugin.name, data, {noclose: true});

            var runTask = theWebUI.getConsoleTask();

            var unbind = function (e, task) {
                if (task.no === runTask.no) {
                    def.resolve(task);
                }
            };

            $(document).on(flm.EVENTS.taskDone, unbind);

            return def.promise().then(function (task) {
                $(document).off(flm.EVENTS.taskDone, unbind);
                return task;
            });
        };

        client.copy = function (files, to) {
            return this.runTask("copy", {
                method: 'filesCopy',
                to: to,
                fls: files
            });

        };

        client.move = function (files, to) {
            return this.runTask("move", {
                method: 'filesMove',
                to: to,
                fls: files
            });
        };

        client.removeFiles = function (paths) {
            return this.runTask("remove", {
                method: 'filesRemove',
                fls: paths
            });

        };

        client.getDir = function (dir) {
            return client.post({
                'method': 'listDirectory',
                'dir': dir
            });
        };

        client.getNfo = function (file, mode) {

            return client.post({
                method: 'viewNfo',
                target: file,
                mode: mode
            });

        };

        client.sfvCheck = function (path) {
            return this.runTask("checksum-verify", {
                method: 'svfCheck',
                target: path
            });

        };

        client.sfvCreate = function (path, files) {
            return this.runTask("checksum-create", {
                method: 'sfvCreate',
                target: path,
                fls: files
            });

        };

        client.createArchive = function (archive, files, options) {
            return this.runTask("compress", {
                method: 'filesCompress',
                target: archive,
                mode: options,
                fls: files
            });
        };

        client.extractFiles = function (archiveFiles, toDir, password) {
            return this.runTask("unpack", {
                method: 'filesExtract',
                fls: archiveFiles,
                password: password,
                to: toDir
            });
        };

        client.mkDir = function (dir) {

            return client.post({
                method: 'newDirectory',
                target: dir
            });

        };

        client.rename = function (source, destination) {

            return client.post({
                method: 'fileRename',
                target: source,
                to: destination
            });

        };

        return client;

    };

    function FileManager() {

        let flm = this
        flm.getPlugin = function () {
            return thePlugins.get('filemanager');
        };

        const plugin = flm.getPlugin();

        flm.currentPath = null;
        flm.showPathPromise = null;
        flm.pluginUrl = plugin.path;
        flm.EVENTS = plugin.ui.EVENTS;
        flm.config = plugin.config;
        flm.getConfig = function () {
            return flm.getPlugin().config;
        }

        // expose api client
        flm.client = function (endpoint) {
            return apiClient(endpoint);
        };

        flm.getCurrentPath = function (file) {

            var path = flm.currentPath + "";

            if ($type(file)) {
                file = file.length > 0 && flm.utils.ltrim(file, '/') || '';
                path = flm.utils.buildPath([path, file]);
            }

            return path;
        };

        flm.goToPath = function (dir) {

            flm.ui.disableNavigation();
            flm.manager.inaction = true;

            return flm.api.getDir(dir)
                .then(function (response) {
                        flm.manager.inaction = false;
                        flm.ui.enableNavigation();

                        flm.currentPath = flm.utils.buildPath([dir]);
                        $(document).trigger(flm.EVENTS.changeDir, [flm.currentPath]);
                        flm.ui.browser.setTableEntries(response.listing);
                    },
                    function (code, msg) {
                        flm.utils.logError(1, msg);
                        flm.ui.enableNavigation();
                    });

        };

        flm.showPath = function (dir, highlight) {

            dir = flm.manager.stripJailPath(dir);
            highlight = highlight || null;

            return flm.goToPath(dir).then(function (value) {

                if (highlight) {
                    flm.showPathPromise = $.Deferred();

                    flm.showPathPromise.promise().then(
                        function () {
                            $(document.getElementById(flm.ui.browser.getEntryHash(highlight)))
                                .trigger("mousedown");
                        }
                    );

                }

                theTabs.show(flm.getPlugin().ui.fsBrowserContainer);


                return value;
            });

        };

        flm.getFile = function (path) {

            // $("#flm-get-data [name ='dir']").val(flm.currentPath);
            $("#flm-get-data [name ='target']").val(path);
            $("#flm-get-data").submit();

        };

        flm.Refresh = function (dir) {
            dir = dir || flm.currentPath;
            return flm.goToPath(dir);
        };


        // events binding
        $(document).on(flm.EVENTS.browserVisible, function () {

            if (flm.showPathPromise) {
                flm.showPathPromise.resolve();
                flm.showPathPromise = null;
            }
        });

        flm.utils = FileManagerUtils();
        flm.api = apiClient(flm.pluginUrl + 'action.php');
        flm.views = FileManagerViews(flm.pluginUrl + 'views');
        flm.ui = userInterface();
        flm.manager = manager();

        return flm;
    }

// namespace

    theWebUI.FileManager = new FileManager();
    global.flm = theWebUI.FileManager;

})
(window);
