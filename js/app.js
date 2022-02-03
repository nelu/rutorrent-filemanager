(function (global) {

    function FileManagerUtils() {

        var utils = {
            perm_map: ['-', '-xx', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'],

            isArchive: function (element) {
                var ext = this.getExt(element)

                var re = new RegExp('^('
                    +flm.getConfig().fileExtractExtensions
                    +')$', "i");

                return ext.match(re);
            },

            isDir: function (element) {
                return (element.charAt(element.length - 1) === '/');
            },

            logSystem: function () {

                var logMsg = arguments[0];

                for (var i = 1; i < arguments.length; i++) {
                    logMsg += arguments[i];
                }
                log('filemanager: ' + logMsg)
            },


            logError: function (errcode, extra) {

                if (!$type(extra)) {
                    extra = '';
                }

                if (errcode) {
                    var codeMsg =  $type(theUILang.fErrMsg[errcode] )
                        ? theUILang.fErrMsg[errcode]
                        : errcode;

                    flm.utils.logSystem(codeMsg , " -> ", extra);
                }

            },

            formatPermissions: function (octal) {

                var map = this.perm_map;
                var arr = octal.split('');

                var out = '';

                for (var i = 0; i < arr.length; i++) {
                    out += map[arr[i]];
                }
                return out;

            },

            formatDate: function (timestamp, format) {

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

                    var ndt = format.replace(/%([dMyhms])/g, function (m0, m1) {
                        return times[m1];
                    });
                    return ndt;
                } else {
                    return '';
                }
            },

            hasDir: function (entries) {
                var hasDirs = false;
                $.each(entries, function (k, v) {
                    if (window.flm.utils.isDir(v)) {
                        hasDirs = true;
                        return false;

                    }

                });

                return hasDirs;
            },

            getICO: function (element) {

                if (this.isDir(element)) {
                    return ('Icon_Dir');
                }

                var iko = 'flm-sprite ';

                element = this.getExt(element).toLowerCase();

                if (element.match(/^r[0-9]+$/)) {
                    return iko + 'sprite-rarpart';
                }

                switch (element) {

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
                    case 'rar':
                        iko += 'sprite-rar';
                        break;
                    case 'zip':
                        iko += 'sprite-zip';
                        break;
                    case 'tar':
                    case 'gz':
                    case 'bz2':
                        iko += 'sprite-archive';
                        break;
                    case 'torrent':
                        iko += 'sprite-torrent';
                        break;
                    default:
                        iko = 'Icon_File';
                }

                return (iko);
            },

            getExt: function (element) {

                if (!$type(element)) {
                    return '';
                }

                var ext = element.split('.').pop();
                var valid = (element.split('.').length > 1) && ext.match(/^[A-Za-z0-9]{2,5}$/);

                ext = valid ? ext : '';

                return ext.toLowerCase();
            },

            basedir: function (path) {

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
            },

            stripBasePath: function (path, basepath) {
                var t = this.trimslashes(path).split(this.trimslashes(basepath));

                var relative = path;

                if (t.length > 1) {
                    relative = t[1];
                }

                return relative;
            },


            json_encode: function (obj) {
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
            },

            rtrim: function (str, char) {
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
            },

            ltrim: function (str, char) {
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

            },

            addslashes: function (str) {
                // http://phpjs.org/functions/addslashes:303
                return (str + '').replace(/[\\"\/]/g, '\\$&').replace(/\u0000/g, '\\0');
            },

            actionResult: function (result) {
                var isSuccess = function () {
                    return result === 'succes';
                };

                return {
                    isSuccess: isSuccess
                }
            },

            isValidPath: function (what) {
                what = what || '';
                //starts with /
                return (what.split('/').length > 1);
            }

        };
        utils.basename = function (what) {
            return utils.trimslashes(what).split('/').pop();
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
            var ret =  '/' + res.join('/');
            if(endingSlash)
            {
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
        };
        utils.stripFileExtension = function (currentPath, exts) {
            exts = exts || [];
            var ext;
            // can be call recursively to strip all present extensions
            currentPath = flm.utils.basename(currentPath);
            var fileName = currentPath + "";

            // escape regex: tar.gz

            //strip current extensions if present
            for (var i = 0; i < exts.length; i++) {
                ext = exts[i];
                var tempExt = ext.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                currentPath = currentPath.replace(new RegExp('\.' + tempExt + '$'), "");
            }

            //generic ext removal
            if (fileName === currentPath) {
                tempExt = flm.utils.getExt(fileName);
                if (tempExt) {
                    currentPath = currentPath.replace(new RegExp('\.' + tempExt + '$'), "");
                }
            }

            return currentPath;
        };
        return utils;

    }


    function FileManager() {

        var getPlugin = function () {
            return thePlugins
                .get('filemanager');
        };

        var pluginUrl = getPlugin().path; // = 'plugins/filemanager/';
        var flm = {
            EVENTS: getPlugin().ui.EVENTS,
            currentPath: null,
            pluginUrl: pluginUrl,
            getConfig: function () {
                return getPlugin().config;
            }
        };

        flm.utils = FileManagerUtils();
        var apiClient = function (endpoint) {

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

                                deferred.reject(data.errcode, data.msg);

                            } else {
                                deferred.resolve(data);
                            }
                        }
                    });

                    return deferred.promise();
                },

                promise: null

            };

            client.runTask = function(name, data) {
                var def = $.Deferred();
                var plugin = getPlugin();
                data.workdir = flm.getCurrentPath();

                theWebUI.startConsoleTask( name, plugin.name, data, { noclose: true });

                var runTask =  theWebUI.getConsoleTask();

                var unbind = function(e, task) {
                    if(task.no === runTask.no)
                    {
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
                return this.runTask("copy",  {
                    method: 'filesCopy',
                    to: to,
                    fls: files
                });

            };

            client.move = function (files, to) {
                return this.runTask("move",  {
                    method: 'filesMove',
                    to: to,
                    fls: files
                });
            };

            client.removeFiles = function (paths) {
                return this.runTask("remove",  {
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

                return client.post({
                    method: 'svfCheck',
                    target: path
                });

            };

            client.sfvCreate = function (path, files) {

                return client.post({
                    method: 'sfvCreate',
                    target: path,
                    fls: files
                });

            };

            client.createArchive = function (archive, files, options) {
                return this.runTask("compress",  {
                    method: 'filesCompress',
                    target: archive,
                    mode: options,
                    fls: files
                });
            };

            client.extractFiles = function (archiveFiles, toDir) {
                return this.runTask("unpack",  {
                    method: 'filesExtract',
                    fls: archiveFiles,
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

        var views = function () {

            var self = {};
            self.viewsPath = pluginUrl + 'views';
            self.namespaces = {'flm': self.viewsPath + '/'};


            for (var funcName in flm.utils) {
                if ($type(flm.utils[funcName]) === "function") {
                    Twig.extendFunction(funcName, flm.utils[funcName]);
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

        var userInterface = function () {

            var self = {};
            self.settings = {
                defaults: {
                    "stripdirs": false,
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
                init: false,
                getSettingValue: function (name) {
                    return $type(theWebUI.settings["webui.flm.settings." + name])
                        && theWebUI.settings["webui.flm.settings." + name]
                        || this.defaults[name];
                },

                getSettings: function () {

                    var all = {};

                    $.each(self.settings.defaults, function (i, v) {
                        all[i] = self.settings.getSettingValue(i);
                    });

                    return all;
                },

                onShow: function () {
                    // plugin config tab in UI settings

                    var self = this;
                    // 1 dialog is enough :)

                    flm.views.getView(flm.views.viewsPath + '/' + 'settings-pane', {'opts': this.getSettings()}, function (view) {
                        if (!self.init) {
                            self.init = true;
                            getPlugin()
                                .attachPageToOptions($('<div id="flm-settings-pane"></div>').get(0), theUILang.fManager);
                        }

                        $(document).trigger(flm.EVENTS.settingsShow, view);

                        $('#flm-settings-pane').html(view);
                        //   self.updateSettings();

                    });

                },
                onSave: function () {
                    var needsave = false;

                    $('#flm-settings-pane').find('input,select').each(function (index, ele) {
                        var inid = $(ele).attr('id').split('flm-settings-opt-');
                        var inval;

                        if ($(ele).attr('type') === 'checkbox') {
                            inval = $(ele).is(':checked') ? true : false;
                        } else {
                            inval = $(ele).val();
                        }

                        if (inval !== self.settings.getSettingValue(inid[1])) {
                            theWebUI.settings["webui.flm.settings." + inid[1]] = inval;
                            needsave = true;
                        }
                    });

                    if (needsave) {
                        theWebUI.save();
                        self.browser.table().refreshRows();
                    }
                },
                updateSettings: function () {
                    $('#flm-settings-pane').find('input, select')
                        .each(function (index, ele) {
                            var inid = ele.id.split('flm-settings-opt-');

                            if ($(ele).attr('type') === 'checkbox') {
                                if (self.settings.getSettingValue(inid[1])) {
                                    $(ele).attr('checked', 'checked');
                                }
                            } else if ($(ele).is("select")) {
                                $(ele).children('option[value="' + self.settings.getSettingValue(inid[1]) + '"]').attr('selected', 'selected');
                            } else {
                                $(ele).val(self.settings.getSettingValue(inid[1]));
                            }
                        });

                }
            };

            var fsBrowser = function () {

                var browse = {
                    tableEntryPrefix: "_flm_",
                    clipaboardEvent: null,
                    clipboardEntries: [],
                    selectedEntries: [],
                    selectedTarget: null,
                    navigationLoaded: false,
                    initialFilesSortAlphaNumeric: null,
                    initialFileSortNumeric: null
                };
                var isVisible = false;


                var uiTable = {
                    table: $('#flm-browser-table table'),
                    ondelete: function () {
                        browse.selectedEntries = browse.getSelection();
                        flm.ui.getDialogs().showDialog('delete')
                    },

                    format: function (table, arr) {
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
                                        if (self.settings.getSettingValue('stripdirs')
                                            && flm.utils.isDir(arr[i])) {
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
                    },

                    sortAlphaNumeric: function (x, y) {

                        var xVal = x.key.split(browse.tableEntryPrefix)[1];
                        var yVal = y.key.split(browse.tableEntryPrefix)[1];

                        if (flm.ui.browser.isTopDir(xVal))
                        {
                            return this.reverse ? 1 : -1;
                        }
                        else if (flm.ui.browser.isTopDir(yVal))
                        {
                            return this.reverse ? -1 : 1;
                        }
                        else if (flm.utils.isDir(xVal) || flm.utils.isDir(yVal))
                        {
                            return (flm.utils.isDir(xVal)
                                && flm.utils.isDir(yVal))
                                ? this.initialFilesSortAlphaNumeric(x, y)
                                : (flm.utils.isDir(xVal) ? 1 : -1);
                        }

                        return (this.initialFilesSortAlphaNumeric(x, y));
                    },

                    sortNumeric: function (x, y) {

                        if (flm.ui.browser.isTopDir(x.key.split(browse.tableEntryPrefix)[1]))
                        {
                            return this.reverse ? 1 : -1;
                        }
                        else if (flm.ui.browser.isTopDir(y.key.split(browse.tableEntryPrefix)[1]))
                        {
                            return this.reverse ? -1 : 1;
                        }

                        return (this.initialFileSortNumeric(x, y));
                    },

                    onDoubleClick: function (obj) {
                        /*    if (theWebUI.FileManager.inaction) {
                                return false;
                            }*/
                        var target = obj.id.slice(5, obj.id.length);

                        browse.open(browse.selectedTarget);
                        return (false);
                    }
                };
                var bindKeys = function () {
                    var ctrlDown = false,
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

                            if (ctrlDown && (e.keyCode == cKey)) {
                                browse.handleKeyCopy();
                            }
                            if (ctrlDown && (e.keyCode == vKey)) {
                                browse.handleKeyPaste();
                            }
                            if (ctrlDown && (e.keyCode == xKey)) {
                                browse.handleKeyMove();
                            }
                        }

                    });

                };

                browse.init = function () {
                    browse.updateTableConfig();
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
                    uiTable.table.addClass('disabled_table');
                };
                browse.enableTable = function () {
                    uiTable.table.removeClass('disabled_table');
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

                    return (checkInTable(what) || checkInTable(what+'/'));
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

                browse.loadNavigation = function () {
                    if (!browse.navigationLoaded) {
                        flm.views.getView(flm.views.viewsPath + '/' + 'table-header', {apiUrl: flm.api.endpoint},
                            function (view) {
                                browse.navigationLoaded = true;
                                var plugin = getPlugin();
                                $('#' + plugin.ui.fsBrowserContainer).prepend(view);

                                $('#flm-navpath').change(function () {
                                    var path = $(this).val();
                                    if (path === flm.currentPath) {
                                        return false;
                                    }

                                    flm.goToPath(path);
                                });

                                $('#flm-nav-refresh').click(function () {
                                    flm.goToPath(flm.currentPath);
                                });
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
                                table.refreshRows();
                                $(document).trigger(flm.EVENTS.browserVisible, browse);
                                theWebUI.resize();

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
                    if ($type(id) && (e.button == 2)) {

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
                    browse.handleKeyCopy();
                };

                browse.handleKeyPaste = function () {
                    if (browse.clipaboardEvent) {
                        browse.selectedEntries = browse.clipboardEntries;
                        flm.ui.getDialogs().showDialog(browse.clipaboardEvent)
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

                        var txtRe = new RegExp(getPlugin().config.textExtensions);

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

                            flm.createTorrent(target);
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
                            menu.push([theUILang.fExtracta, "flm.ui.getDialogs().showDialog('extract')"]);
                            menu.push([CMENU_SEP]);
                        }

                        (fext === 'sfv')
                        && menu.push([theUILang.fcheckSFV, "flm.ui.getDialogs().showDialog('sfv_check')"]);

                        (!pathIsDir && thePlugins.isInstalled('mediainfo'))
                        && menu.push([theUILang.fMediaI, function () {
                            flm.doMediainfo(target);
                        }]);
                    } else {
                        menu.push([theUILang.fcNewDir, "flm.ui.getDialogs().showDialog('mkdir')"]);
                    }

                    if(menu[menu.length-1][0] !== CMENU_SEP)
                    {
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
                    var table = browser.table();

                    table.initialFileSortNumeric = table.sortNumeric;
                    table.sortNumeric = uiTable.sortNumeric;

                    table.initialFilesSortAlphaNumeric = table.sortAlphaNumeric;
                    table.sortAlphaNumeric = uiTable.sortAlphaNumeric;
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

                        if (!self.settings.getSettingValue('showhidden') && (file.name.charAt(0) === '.')) {
                            table.hideRow(hash);
                        }
                    });
                    table.refreshRows();

                };

                browse.table = function () {
                    return theWebUI.getTable("flm");
                };

                browse.updateNavigationPath = function () {

                    var cpath = $('#flm-navpath');

                    var historySize = self.settings.getSettingValue('histpath');

                    var entries = [];

                    entries.push(flm.currentPath);


                    cpath.children('option').each(function (index, val) {
                        if (entries.length < historySize) {
                            if (val.value !== flm.currentPath && val.value !== '/') {
                                entries.push(val.value);
                            }
                        }
                    });

                    flm.currentPath !== '/' && entries.push('/');

                    var stripDirs = self.settings.getSettingValue('stripdirs');

                    cpath.empty();
                    var path;
                    for (var i = 0; i < entries.length; i++) {
                        path = entries[i];
                        var option = $('<option>' + (stripDirs ? flm.utils.rtrim(path, '/') : path) + '</option>');
                        (path === flm.currentPath) && option.attr('selected', 'selected');
                        cpath.append(option);
                    }

                };

                browse.updateTableConfig = function () {

                    var table = browse.table();

                    table.renameColumnById('time', theUILang.fTime);
                    table.renameColumnById('type', theUILang.fType);
                    table.renameColumnById('perm', theUILang.fPerm);
                    table.format = function () {
                        return uiTable.format.apply(browse, arguments);
                    };
                    table.ondblclick = function () {
                        return uiTable.onDoubleClick.apply(browse, arguments);
                    };
                    table.ondelete = function () {
                        return uiTable.ondelete.apply(browse, arguments);
                    };
                    table.onselect = function () {
                        browse.onSelectEntry.apply(browse, arguments);
                    };

                };

                return browse;
            };

            var browser = fsBrowser();

            // file operation dialogs
            var dialogs = {

                activeDialogs: {},
                onStartEvent: null,
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

                                        var promise = diags.onStartEvent.apply(diags, arguments);
                                        promise.then(function () {
                                                dialogs.hide(diagId);
                                            },
                                            function (data,msg) {
                                                    flm.utils.logError(data, msg);
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
                        $('.flm-diag-start').focus();

                    }, 100);

                },

                disableStartButton: function (diag) {
                    diag = diag || this.getDialogId('window');
                    $(diag + ' .flm-diag-start').attr('disabled', true);
                },
                enableStartButton: function (diag) {
                    diag = diag || this.getDialogId('window');
                    $(diag + ' .flm-diag-start').attr('disabled', false);
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
                    container = container + '.dlg-window .flm-diag-nav-path';
                    var ele = $(container);
                    return ele[0].tagName.toLowerCase() === 'input' ? ele.val() : ele.text();
                },
                hide: function (dialogId, afterHide) {
                    dialogId = dialogId || 'window';
                    dialogId = flm.utils.ltrim(dialogId, '#');

                    theDialogManager.hide(dialogId, afterHide);

                },

                onStart: function (callback) {
                    this.onStartEvent = callback;
                },

                show: function (dialogId, afterShow) {
                    dialogId = dialogId || 'window';
                    theDialogManager.show(flm.utils.ltrim(dialogId, '#'), afterShow);
                },

                updateTargetPath: function (container, path) {
                    container = container + '.dlg-window .flm-diag-nav-path';

                    var ele = $(container);
                    return ele[0].tagName.toLowerCase() === 'input' ? ele.val(path) : ele.text(path);
                },

                setDirBrowser: function (diagId, withFiles) {

                    var inputSelectors = $(diagId + ' .flm-diag-nav-path');
                    var buttonSelectors = $(diagId + ' .flm-diag-nav-browse-but');

                    diagId = flm.utils.ltrim(diagId, '#');
                    withFiles = withFiles || false;

                    var browseBtn;
                    var editField
                    var dirBrowse;
                    var self = this;
                    for (var i = 0; i < inputSelectors.length; i++) {
                        editField = inputSelectors[i];
                        browseBtn = buttonSelectors[i];

                        if (thePlugins.isInstalled("_getdir")) {

                            if (!this.dirBrowser.hasOwnProperty(diagId)) {
                                this.dirBrowser[diagId] = []
                            }

                            dirBrowse = new theWebUI.rDirBrowser(
                                diagId,
                                editField.id,
                                browseBtn.id,
                                null,
                                withFiles
                            );

                            dirBrowse.monitorUpdates();

                            $(editField).change(function (event) {
                                $(this).val(flm.utils.buildPath([event.target.value]))
                            });

                            this.dirBrowser[diagId][i] = dirBrowse;


                        } else {
                            $(browseBtn).hide();
                        }

                    }
                    return this.dirBrowser[diagId];
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
                getPlugin().ui.readyPromise.resolve(self);

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
                $('#tab_lcont').append('<input type="button" id="fMan_showconsole" class="Button" value="Console" style="display: none;">');
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
                        console.log('showSFVcreate shown');
                    }
                });
            };

            self.browser = browser;

            return self;

        };

        flm.api = apiClient(getPlugin().path + 'action.php');

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
            theWebUI.FileManager.inaction = true;

            return flm.api.getDir(dir)
                .then(function (response) {
                        theWebUI.FileManager.inaction = false;
                        flm.ui.enableNavigation();


                        /*     if (this.isErr(response.errcode, dir)) {
                                 return false;
                             }*/

                        flm.currentPath = flm.utils.buildPath([dir]);
                        flm.ui.browser.updateNavigationPath();
                        flm.ui.browser.setTableEntries(response.listing);


                    },
                    function (code, msg) {
                        flm.utils.logError(1, msg);
                        flm.ui.enableNavigation();
                    });

        };

        flm.showPathPromise = null;

        // events binding


        $(document).on(flm.EVENTS.browserVisible, function (e) {

            if (flm.showPathPromise) {
                flm.showPathPromise.resolve();
                flm.showPathPromise = null;
            }
        });


        flm.showPath = function (dir, hilight) {

            dir = flm.manager.stripHomePath(dir);
            hilight = hilight || null;

            return flm.goToPath(dir).then(function (value) {

                if (hilight) {
                    flm.showPathPromise = $.Deferred();

                    flm.showPathPromise.promise().then(
                        function () {
                            $(document.getElementById(flm.ui.browser.getEntryHash(hilight)))
                                .trigger("mousedown");
                        }
                    );

                }

                theTabs.show(getPlugin().ui.fsBrowserContainer);


                return value;
            });

        };

        flm.getFile = function (path) {

            // $("#flm-get-data [name ='dir']").val(flm.currentPath);
            $("#flm-get-data [name ='target']").val(path);
            $("#flm-get-data").submit();

        };

        flm.Refresh = function (dir) {

            if (!$type(dir) || (dir === flm.currentPath)) {
                flm.goToPath(flm.currentPath);
            }

        };

        var manager = {
            inaction: false,
            logStart: function (message) {

                //TODO: dialog id binds for stop
                $("#flm-diag-console-stop").attr('disabled', false);

                if (flm.ui.settings.getSettingValue('cleanlog')) {
                    flm.ui.console.clearlog();
                } else {
                    flm.ui.console.logMsg("-------\n");
                }

                flm.ui.console.show(message);
                flm.ui.console.showProgress();

                // flm.ui.getDialogs().hide();
            },

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

            stripHomePath: function (entry) {

                return flm.utils.stripBasePath(entry, flm.getConfig().homedir);

            },

            getFullPaths: function (entries) {

                for (var i = 0; i < entries.length; i++) {
                    entries[i] = flm.getCurrentPath(this.stripHomePath(entries[i]));
                }

                return entries;

            },

            createTorrent: function (target) {

                var homedir = flm.getConfig().homedir;
                var relative = flm.manager.stripHomePath(target);
                var isRelative = (relative !== target);

                var path = flm.utils.buildPath([homedir, isRelative ? relative : target]);

                $('#path_edit').val(path);

                if ($('#tcreate').css('display') === 'none') {
                    theWebUI.showCreate();
                }

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

                theWebUI.startConsoleTask("mediainfo", getPlugin().name, {
                    'action': 'fileMediaInfo',
                    'target': target
                }, {noclose: true});

            },

            recname: function (what) {

                if (flm.utils.isDir(what)) {
                    return flm.utils.trimslashes(what);
                }

                var ext = flm.utils.getExt(what);

                var recf = what.split(ext);

                if (recf.length > 1) {
                    recf.pop();
                    recf = recf.join(ext).split('.');
                    if (recf[recf.length - 1] == '') {
                        recf.pop();
                    }
                    return (recf.join('.'));
                }

                return (recf.join(''));

            }

        };


        flm.views = views();
        flm.ui = userInterface();

        flm.manager = manager;

        return flm;
    }

// namespace

    global.flm = FileManager();
    theWebUI.FileManager = window.flm.manager;
})
(window);
