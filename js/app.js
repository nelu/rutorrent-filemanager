function FileManagerUtils() {

    var utils = {
        perm_map: ['-', '-xx', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'],
        archive_types: ["zip", "rar", "tar", "gz", "bz2"],
        isArchive: function (element) {
            var fext = this.getExt(element);
            return (this.archive_types.indexOf(fext) > -1);

            // return fext.match(/^(zip|rar|tar|gz|bz2)$/i);
        },
        isDir: function (element) {
            return (element.charAt(element.length - 1) === '/');
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

            return '/' + this.trimslashes(last);
        },


        encode_string: function (str) {

            return encodeURIComponent(this.json_encode(str));

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

        validname: function (what) {
            //starts with /
            return (what.split('/').length > 1);
        }

    };
    utils.basename = function(what)
    {
        return utils.trimslashes(what).split('/').pop();
    };

    utils.buildPath= function (parts) {

        var res = [];
        var item;
        for (var i = 0; i < parts.length; i++) {
            item = utils.trimslashes(parts[i]);
            if (item !== "") {
                res.push(item);
            }
        }
        return '/' + res.join('/');

    };
    utils.trimslashes= function (str) {

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

    return utils;

}


function FileManager() {

    var flm = {
        getConfig: function () {
            return theWebUI.settings["webui.flm.config"];
        }
    };

    var pluginUrl = 'plugins/filemanager';

    var getPlugin = function () {
        return thePlugins
            .get('filemanager');
    };

    flm.utils = FileManagerUtils();
    var apiClient = function (endpoint) {

        endpoint = endpoint || getPlugin().path + 'action.php';
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
                            || (data.hasOwnProperty('error') && data.error))
                        {
                            deferred.reject({'response': data});

                        } else {
                            deferred.resolve(data);
                        }
                    }
                });

                return deferred.promise();
            },

            promise: null
        };

        client.copy  = function(files, to) {

            return client.post({
                method: 'filesCopy',
                to: to,
                fls: files
            });

        };

        client.move  = function(files, to) {

            return client.post({
                method: 'filesMove',
                to: to,
                fls: files
            });

        };
        client.removeFiles = function(paths) {
            return client.post({
                method: 'filesRemove',
                fls: paths
            });
        };

        client.getDir = function (dir) {

            return client.post({
                'method': 'listDirectory',
                'dir': dir
            });
    /*
                .then(
                    function (response) {
                        callback === undefined || callback(response.listing);
                        return response;
                    },
                    function (response) {
                        // log(theUILang.fErrMsg[9]);
                        console.error(response);

                        log(theUILang.fErrMsg[10] + ' - ' + dir);
                        return response;
                    }
                );*/
        };

        client.getNfo= function (file, mode) {

            return client.post({
                method: 'viewNfo',
                target: file,
                mode: mode
            });
        };

        client.createArchive = function(archive, files) {

            return client.post({
                method: 'filesCompress',
                target: archive,
                mode: options,
                fls: files
            });
        };
        client.mkDir= function(dir) {
                return client.post({
                    method: 'newDirectory',
                    target: dir
                });

            };

        client.rename = function(source, destination) {

            return client.post({
                method: 'fileRename',
                target: source,
                to: destination
            });

        };

        client.stats= function (diag) {

                var actioncall = {
                    method: 'taskLog',
                    target: theWebUI.fManager.actiontoken,
                    to: theWebUI.fManager.actionlp
                };

                var responseHandle = function (data) {
                    theWebUI.fManager.actionstats = data.status;
                    theWebUI.fManager.actionlp = data.lp;
                    theWebUI.fManager.cmdlog(data.lines);

                    if (!theWebUI.fManager.isErr(data.errcode) && (data.status < 1)) {
                        theWebUI.fManager.actiontimeout = setTimeout(theWebUI.fManager.action.stats, 1000);
                    } else {
                        theWebUI.fManager.cleanactions();
                        if (flm.currentPath === theWebUI.fManager.workpath) {
                            theWebUI.fManager.Refresh();
                        }
                    }
                };


                theWebUI.fManager.action.postRequest({
                    action: flm.utils.json_encode(actioncall)
                }, responseHandle);

            };

        return client;
    };


    var views = function () {
        var self = {};
        self.viewsPath = pluginUrl + '/views';
        self.namespaces =  {'flm': self.viewsPath + '/'};


        for (var funcName in flm.utils) {
            if ($type(flm.utils[funcName]) === "function") {
                Twig.extendFunction(funcName, flm.utils[funcName]);
            }
        }

        self.getView = function (name, options, fn) {
            //
            options = options || {};
            var filename = name + '.twig';

            options.views = options.views || 'flm';
            options.theUILang = theUILang;
            options.utils= flm.utils;
            options.settings = {
                'twig options': {
                    namespaces: self.namespaces,
                    name: filename,
                    href: self.viewsPath + '/' + filename
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
            getSettingValue: function(name)
            {
                return $type(theWebUI.settings["webui.flm.settings." + name])
                    && theWebUI.settings["webui.flm.settings." + name]
                    || this.defaults[name];
            },

            getSettings: function() {

                var all = {};

                $.each(self.settings.defaults, function (i,v) {
                        all[i] = self.settings.getSettingValue(i);
                });

                return all;
            },

            onShow: function (arg) {
                console.log('flm.ui.settings on Show', arg);
                // plugin config tab in UI settings

                var self = this;
                // 1 dialog is enough :)

                flm.views.getView('settings-pane', {'opts': this.getSettings()}, function (view) {
                    if (!self.init) {
                        self.init = true;
                        getPlugin()
                            .attachPageToOptions($('<div id="flm-settings-pane"></div>').get(0), theUILang.fManager);
                    }

                    $('#flm-settings-pane').html(view);
                 //   self.updateSettings();

                });

            },
            onSave: function (arg) {
                var needsave = false;

                $('#flm-settings-pane').find('input,select').each(function(index, ele) {
                    var inid = $(ele).attr('id').split('flm-settings-opt-');
                    var inval;

                    if ($(ele).attr('type') === 'checkbox') {
                        inval = $(ele).is(':checked') ? true : false;
                    } else {
                        inval = $(ele).val();
                    }

                    if (inval !== self.settings.getSettingValue(inid[1]))
                    {
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
                selectedTarget: null,
                navigationLoaded: false,
                initialFilesSortAlphaNumeric: null,
                initialFileSortNumeric: null
            };
            var isVisible = false;


            var uiTable = {
                table: $('#flm-browser-table table'),
                ondelete: function () {
                    self.showDelete();
                },

                format: function (table, arr) {
                    var i;
                    for (i=0; i< arr.length;i++) {
                        if (arr[i] == null) {
                            arr[i] = '';
                        } else {
                            switch (table.getIdByCol(i)) {
                                case 'name':
                                    if (flm.ui.browser.isTopDir(arr[i])) {
                                        arr[i] = '../';
                                    }
                                    if (self.settings.getSettingValue('stripdirs')
                                        && flm.utils.isDir(arr[i]))
                                    {
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

                    var xVal = x.key.split('_flm_')[1];
                    var yVal = y.key.split('_flm_')[1];

                    if (flm.ui.browser.isTopDir(xVal)
                        || flm.ui.browser.isTopDir(yVal)
                    ) {
                        return !this.reverse ? 1 : -1;
                    } else if
                    (flm.utils.isDir(xVal)
                        || flm.utils.isDir(yVal)) {
                        return (flm.utils.isDir(xVal)
                            && flm.utils.isDir(yVal))
                            ? this.initialFilesSortAlphaNumeric(x, y)
                            : (flm.utils.isDir(xVal) ? 1 : -1);

                    }

                    return (this.initialFilesSortAlphaNumeric(x, y));
                },

                sortNumeric: function (x, y) {

                    if (flm.ui.browser.isTopDir(x.key.split('_flm_')[1])
                        || flm.ui.browser.isTopDir(y.key.split('_flm_')[1])
                    ) {
                        return !this.reverse ? 1 : -1;
                    }

                    return (this.initialFileSortNumeric(x, y));
                },

                onDoubleClick: function (obj) {
                    /*    if (theWebUI.fManager.inaction) {
                            return false;
                        }*/
                    var target = obj.id.slice(5, obj.id.length);

                    if (flm.utils.isDir(target)) {
                        browse.navTo(target);
                    } else {
                        browse.getFile(target);
                    }

                    return (false);
                }
            };


            browse.init = function () {
                browse.updateTableConfig();
                browse.setSorting();
            };

            // up dir path check
            browse.isTopDir = function (path) {
                path = flm.utils.buildPath([path]);
                return (path === flm.utils.basedir(flm.currentPath));
            };

            browse.disableTable = function () {
                uiTable.table.addClass('disabled_table');
            };
            browse.enableTable = function () {
                uiTable.table.removeClass('disabled_table');
            };

            browse.disableRefresh = function () {
                $('#flm-nav-refresh').attr('disabled' , true);
            };
            browse.enableRefresh = function () {
                $('#flm-nav-refresh').attr('disabled' , false);
            };

            browse.getSelection = function () {
                var selectedEntries = [];
                var rows = browse.table().rowSel;
                var entryName;
                for (var i in rows) {
                    entryName = i.split('_flm_')[1];
                    if ((!rows[i]) || browse.isTopDir(entryName)) {
                        continue;
                    }
                    selectedEntries.push(entryName);
                }

                return selectedEntries;

            };

            browse.loadNavigation = function () {
                if (!browse.navigationLoaded) {
                    flm.views.getView('table-header',{apiUrl: flm.api.endpoint},
                        function (view) {
                            browse.navigationLoaded = true;
                            var plugin = getPlugin();
                            $('#' + plugin.ui.fsBrowserContainer).prepend(view);

                            $('#flm-navpath').change(function () {
                                var path = $(this).val();
                                if (path == flm.currentPath) {
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
                console.log('Filemanager ui broswer onshow');
                if (isVisible) {
                    return;
                }
                isVisible = true;
                browse.loadNavigation();
                var table = browse.table();
                if (table) {
                    flm.goToPath(flm.currentPath).then(function () {
                        table.refreshRows();
                        theWebUI.resize();
                    });

                    $('#fMan_showconsole').show();
                    // display table columns
                    table.refreshRows();

                }
            };

            browse.onHide = function () {
                console.log('Filemanager ui broswer onhide');
                isVisible = false;

                $('#fMan_showconsole').hide();
            };

            // executed outside the browse/this scope
            browse.onSelectEntry = function (e, id) {

                var target = id.split('_flm_')[1];
                browse.selectedTarget = target;

                // handles right/left click events
                if ($type(id) && (e.button == 2)) {

                    theContextMenu.clear();

                    theContextMenu = browse.setEntryMenu(theContextMenu, target);

                    theContextMenu.show();
                } else {
                    // normal click - focus
                }
            };

            browse.setEntryMenu = function (context, path) {
                var utils = FileManagerUtils();

                var pathIsDir = utils.isDir(path);
                path = '/' + utils.ltrim(path, '/');

                var table = browse.table();
                var flm = theWebUI.fManager;

                context.add([theUILang.fOpen, (table.selCount > 1) ? null : (pathIsDir ? function () {
                    browse.navTo(path);
                } : function () {
                    browse.getFile(path);
                })]);

                if (!browse.isTopDir(path)) {

                   // flm.workpath = flm.currentPath;

                    var fext = utils.getExt(path);

                    if (fext.match(/nfo|txt/ )) {
                        context.add([CMENU_SEP]);
                        context.add([theUILang.fView,
                            function () {
                                self.viewNFO(path);
                            }]);
                        context.add([CMENU_SEP]);
                    }

                    context.add([theUILang.fCopy, "flm.ui.showCopy()"]);
                    context.add([theUILang.fMove, "flm.ui.showMove()"]);
                    context.add([theUILang.fDelete, "flm.ui.showDelete()"]);
                    if (!(table.selCount > 1)) {
                        context.add([theUILang.fRename, 'flm.ui.showRename()']);
                    }
                    context.add([CMENU_SEP]);

                    if (utils.isArchive(path) && !(table.selCount > 1)) {
                        context.add([theUILang.fExtracta, "flm.ui.showExtract()"]);
                        context.add([CMENU_SEP]);
                    }

                    var create_sub = [];

                    create_sub.push([theUILang.fcNewTor, thePlugins.isInstalled('create') && !(table.selCount > 1) ? function () {
                        flm.createT(path);
                    } : null]);
                    create_sub.push([CMENU_SEP]);
                    create_sub.push([theUILang.fcNewDir, "flm.ui.showCreateDir()"]);
                    create_sub.push([theUILang.fcNewArchive, "flm.ui.showArchive()"]);

                    if (!utils.hasDir(browse.getSelection())) {
                        create_sub.push([CMENU_SEP]);
                        create_sub.push([theUILang.fcSFV, "flm.ui.showSFVcreate()"]);
                    }


                    //    create_sub.push([theUILang.fcScreens, (thePlugins.isInstalled('screenshots') && !pathIsDir && utils.getExt(path).match(new RegExp("^(" + thePlugins.get('screenshots').extensions.join('|') + ")$", "i")) && !(this.actiontimeout > 0)) ? flm.actionCheck('Screenshots', path) : null]);

                    context.add([CMENU_CHILD, theUILang.fcreate, create_sub]);


                    (fext === 'sfv')
                    && context.add([theUILang.fcheckSFV, "flm.ui.showSFVcheck()"]);
                    (!pathIsDir && thePlugins.isInstalled('mediainfo'))
                    && context.add([theUILang.fMediaI, function () {
                        flm.doMediainfo(path);
                    }]);

                } else {
                    context.add([theUILang.fcNewDir, "flm.ui.showCreateDir()"]);
                }

                context.add([CMENU_SEP]);
              /*  context.add(["Permissions", "flm.ui.showPermissions()"]);*/

                context.add([theUILang.fRefresh, "flm.goToPath(flm.currentPath)"]);


                return context;
            };

            // navigation
            browse.navTo = function (path) {
                path = flm.utils.buildPath([path]);
                // up dir path check
                var fullPath = browse.isTopDir(path)
                    ? path
                    : flm.utils.buildPath([flm.currentPath, path]);

                flm.goToPath(fullPath);
            };

            // get file
            browse.getFile = function (path) {
                var fullPath = flm.currentPath + '/' + flm.utils.trimslashes(path);
                flm.getFile(fullPath);
            };

            // table

            browse.setSorting = function () {
                var table = theWebUI.getTable("flm");

                table.initialFileSortNumeric = table.sortNumeric;
                table.sortNumeric = uiTable.sortNumeric;

                table.initialFilesSortAlphaNumeric = table.sortAlphaNumeric;
                table.sortAlphaNumeric = uiTable.sortAlphaNumeric;
            };

            browse.setTableEntries = function (data) {

                var table = browse.table();

                table.clearRows();

                if (flm.currentPath !== '/') {
                    var path = flm.utils.basedir(flm.currentPath) + '/'; // trailing slash required, its a dir
                    table.addRowById({
                            name: path,
                            size: '',
                            time: '',
                            type: '/',
                            perm: ''
                        },
                        "_flm_" + path,
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

                    var hash = "_flm_" + file.name;

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

                cpath.empty();
                var path;
                for (var i = 0; i < entries.length; i++) {

                    path = entries[i];
                    var option = $('<option>' + path + '</option>');

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
            dirBrowser: null,
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
                    modal: true,
                    template: 'dialog-new-dir'
                },
                move: {
                    modal: true,
                    pathbrowse: true,
                    template: "dialog-move"
                },
                delete: {
                    modal: true,
                    pathbrowse: true,
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
                    template: "dialog-sfv-check"
                },
                sfv_create: {
                    modal: true,
                    pathbrowse: true,
                    multiselectFilesOnly: true,
                    template: "dialog-svf_create"
                },
                nfo_view: {
                    modal: true,
                    template: "dialog-nfo_view"
                }
            },

            // common after event handle
            afterHide: function(id, what) {
                $type(this.dirBrowser)
                && this.dirBrowser.hide();
            },
            // common before event handle
            beforeShow: function (id, what) {
                var diagId = this.getDialogId(what);
                var diags = this;

                diags.getDialogHeader(id)
                    .empty()
                    .html(theUILang[diagId])
                    .prepend('<span class="flm-sprite-diag flm-sprite sprite-' + what + '"></span>');

                var config = this.forms[what];

                if ($type(config.modal) && config.modal) {
                    theDialogManager.setModalState();
                } else {
                    theDialogManager.clearModalState();
                }

                var data = {
                    apiUrl: flm.api.endpoint,
                    selectedEntries: browser.getSelection(),
                    selectedTarget: flm.getCurrentPath(browser.selectedTarget),
                    currentPath: flm.getCurrentPath('/')
                };

                flm.views.getView(config.template, data,
                    function (html) {
                        var newContent = $('#' + id + ' .flm_popup-content')
                            .html(html);

                        newContent.find('.flm-diag-cancel')
                            .click(function () {
                                diags.hide();
                            });
                        newContent.find('.flm-diag-start')
                            .click(function () {
                                console.log('start triggered');
                            });
                        diags.enableStartButton(id);

                        newContent.find('.flm-diag-start').attr('disabled', false)
                            .click(function () {
                                if ($type(diags.onStartEvent) === "function") {
                                    diags.onStartEvent.apply(diags, arguments);
                                }
                            });

                        $type(config.pathbrowse) && diags.setDirBrowser();
                    }
                    );

            },

            checkInputs: function (diag, forcedir) {

                forcedir = $type(forcedir) ? true : false;

                var path = $.trim($('#flm-diag-navigation-path').val());

                if (!path) {
                    alert(theUILang.fDiagNoPath);
                    return false;
                }
                if (path.length < this.homedir.length) {
                    alert(theUILang.fDiagNoPath);
                    return false;
                }

                //       path = path.split(this.homedir);
                path = flm.utils.trimslashes(path[1]);

                if ((path == flm.utils.trimslashes(flm.currentPath)) && !forcedir) {
                    alert(theUILang.fDiagNoPath);
                    return false;
                }

                var funky = flm.utils.trimslashes(flm.currentPath) ? flm.utils.trimslashes(path.split(flm.utils.trimslashes(flm.currentPath) + '/')[1]).split('/').shift() : path.split('/').shift();
                if (this.isChecked('fMan_' + diag, this.basedir(path)) || this.fileExists(funky)) {
                    alert(theUILang.fDiagNoPath);
                    return false;
                }

                return '/' + path;
            },

            disableStartButton: function (diag) {
                diag = diag || this.getDialogId('window');
                $('#' + diag + ' .flm-diag-start').attr('disabled', true);
            },
            enableStartButton: function (diag) {
                diag = diag || this.getDialogId('window');
                $('#' + diag + ' .flm-diag-start').attr('disabled', false);
            },

            getCheckedList: function (diag) {

                var list = [];

                diag = diag || this.getDialogId('window');
                var checks = $('#' + diag + ' .checklist input:checked');

                checks.each(function (index, val) {
                    list.push(flm.utils.addslashes(decodeURIComponent(val.value)));

                });

                return list;
            },
            getDialogId: function (what) {
                return 'flm_popup_' + what;
            },

            getDialogHeader: function (diagId) {
                return $('#' + diagId + "-header");
            },

            getTargetPath: function(container)
            {
                container = container || '#flm-diag-navigation-path';
                var ele = $(container);
                return ele[0].tagName.toLowerCase() === 'input' ? ele.val() : ele.text() ;
            },
            hide: function (afterHide) {
                theDialogManager.hide(this.getDialogId('window'), afterHide);
            },

            onStart: function (callback) {
                this.onStartEvent = callback;
            },

            show: function (afterShow) {
                theDialogManager.show(this.getDialogId('window'), afterShow);
            },

            updateTargetPath: function (path) {
                return $('#flm-diag-navigation-path').val(path);
            },

            setDirBrowser: function() {

                if (thePlugins.isInstalled("_getdir")) {

                    this.dirBrowser = new theWebUI.rDirBrowser(
                        this.getDialogId('window'),
                        'flm-diag-navigation-path',
                        'flm-diag-navigation-browse-but',
                        null, false);

                } else {
                    $('flm-diag-navigation-browse-but').hide();
                }
                return this.dirBrowser;
            },
            //makeVisbile
            showDialog: function (what, viewEvents) {

                viewEvents = viewEvents || {};

                if (!this.forms.hasOwnProperty(what)) {
                    console.error('No such dialog configured: ', what);
                    return;
                }

                var diagId = this.getDialogId('window');
                var diags = this;

                // create it
                if (!theDialogManager.items.hasOwnProperty(diagId)) {

                    theDialogManager.make(diagId,
                        '',
                        $('<div class="cont fxcaret flm_popup-content"></div>').get(0),
                        true); // prevent the user from changing table selection by default

                }
                $.each(['beforeHide', 'beforeShow', 'afterHide', 'afterShow'], function (ndx, evName) {

                    theDialogManager.setHandler(diagId, evName, function (id) {
                        var promise = $type(diags[evName])
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
            dialog: function() {
              return  $('#'+dialogs.getDialogId('console'));
            },

            writeConsole: function(text)
            {
                var promise = this.loaded ? this.loaded.promise() : this.show();

                return promise.then(
                    function(){
                        var console = self.console.dialog().find('#flm_popup_console-log-container');

                        if (browser.isIE) {
                            console.innerHTML = "<pre>" + console.html() + text + "</pre>";
                        } else {
                            console.find('pre').append(text);
                        }

                    }
                );
            },
            loadConsole: function(onLoaded) {
                var config = dialogs.forms['console'];
                var diagId = dialogs.getDialogId('console');

                if(self.console.loaded)
                {
                    return self.console.loaded.promise();
                }

                self.console.loaded = $.Deferred();
                if (!theDialogManager.items.hasOwnProperty(diagId))
                {
                    // create it
                    flm.views.getView(config.template, {}, function (html)
                    {
                        theDialogManager.make(diagId, theUILang.flm_popup_console,
                            $(html).get(0),
                            config.modal); // prevent the user from changing table selection by default
                        dialogs.getDialogHeader(diagId)
                            .prepend('<span class="flm-sprite-diag flm-sprite sprite-console"></span>');

                        $('#flm-diag-console-clear').click(function () {
                            self.console.clearlog();
                        });

                        theDialogManager.setHandler(diagId, 'beforeShow', function () {
                            $('#flm-diag-stop').click(function () {
                                console.log('Current action stop triggered from console diags');
                                self.console.logMsg(theUILang.fStops[theWebUI.fManager.activediag] + "\n");
                                theWebUI.fManager.actStop();

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

                text = text+"\n";
                self.console.writeConsole(text).then(
                    function(){
                        var console = self.console.dialog().find('#flm_popup_console-log-container');
                        console[0].scrollTop = console[0].scrollHeight;
                    }
                );

            },

            clearlog: function() {
                return $('#flm_popup_console-log-container pre').empty();
            },

            show: function (msg, viewEvents) {
                var diagId = dialogs.getDialogId('console');

                return self.console.loadConsole().then(
                    function(){
                        // override previous callbacks
                        viewEvents = viewEvents || {};

                        /*             $.each(['beforeHide', 'beforeShow', 'afterHide', 'afterShow'], function (ndx, evName) {

                                         theDialogManager.setHandler(diagId, evName, function (id) {
                                             viewEvents.hasOwnProperty(evName)
                                             && viewEvents[evName].apply(diags, [id, what]);

                                         });

                                     });*/
                        $type(msg) && self.console.logMsg(msg);
                        theDialogManager.show(diagId);
                    }
                );

            },

            showProgress: function() {
                    return this.loadConsole().then(
                        function(){
                            self.console.dialog()
                                .find('.buttons-list').addClass("flm-sprite-loading-"+self.console.loader);
                        }
                    )
            },
            hideProgress: function() {
                self.console.dialog()
                    .find('.buttons-list').removeClass("flm-sprite-loading-"+self.console.loader);
            }

    };

        // file operation dialogs

        self.getDialogs = function()
        {
            return dialogs;
        };

        self.init = function () {
            console.log('flm.ui.init', this);

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


        self.doSel = function (diag) {

            diag = self.getPopupId(diag);

            var forcedirs = (diag == 'fMan_CreateSFV') ? true : false;

            if (!(theWebUI.fManager.actiontoken.length > 1)) {
                this.generateSelection($('#' + diag + 'list'), forcedirs);
                $('#' + diag + ' .fMan_Start').attr('disabled', false);
            }

            this.makeVisbile(diag);
        };

        self.initFileBrowser = function () {
            $('#tab_lcont').append('<input type="button" id="fMan_showconsole" class="Button" value="Console" style="display: none;">');
            $('#fMan_showconsole').click(function () {
                self.console.show();
            });
            // file navigation
            browser.init();
        };

        self.showArchive = function (button) {

            return dialogs.showDialog('archive',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();
                        var ext = 'zip';
                        $('#flm-diag-navigation-path').val(flm.currentPath + flm.manager.recname(name) + '.' + ext);

                    }
                });


        };

        self.showCopy = function () {
            dialogs.showDialog('copy');
        };

        self.showCreateDir = function () {
            dialogs.showDialog('mkdir');
        };

        self.showDelete = function () {
            dialogs.showDialog('delete');
        };
        self.showExtract = function () {
            dialogs.showDialog('extract');
        };

        self.showMove = function () {
            dialogs.showDialog('move');
        };

        self.viewNFO= function (file) {
            dialogs.showDialog('nfo_view');
        };

        self.showPermissions = function () {
                dialogs.showDialog('permissions',
                    {
                        beforeShow: function () {
                            dialogs.onStart(function () {
                                console.log('self.showPermissions dialogs.onStart');
                            });
                        },
                        afterHide: function () {
                            console.log('showPermissions closed');
                        }
                    });

        };

        self.showRename = function () {
            return dialogs.showDialog('rename');
        };

        self.showSFVcheck = function () {
            dialogs.showDialog('sfv_check');
        };

        self.showSFVcreate = function () {
            dialogs.showDialog('sfv_create',{
                afterShow: function () {
                        console.log('showSFVcreate shown');
                    }
                });
        };

        self.resize = function (w, h) {

            if (w !== null) {
                w -= 8;
            }

            if (h !== null) {
                h -= ($("#tabbar").height());
                h -= ($("#fMan_navpath").height());
                h -= 2;
            }

            var table = self.browser.table();
            if (table) {
                table.resize(w, h);
            }
        };

        self.browser = browser;

        return self;
    };


    flm.api = apiClient();
    flm.currentPath = '/';

    flm.getCurrentPath = function (file) {
        var path = flm.currentPath + "";
        if ($type(file)) {
            file = file.length > 0 && flm.utils.trimslashes(file) || '';
            path = flm.utils.buildPath([path, file]);

        }
        return path;

    };

    flm.goToPath = function (dir) {
        flm.ui.disableNavigation();
        theWebUI.fManager.inaction = true;

        return flm.api.getDir(dir)
            .then(function (response) {
                    theWebUI.fManager.inaction = false;
                    flm.ui.enableNavigation();


                    /*     if (this.isErr(response.errcode, dir)) {
                             return false;
                         }*/

                    flm.currentPath = flm.utils.buildPath([dir]);

                    flm.ui.browser.updateNavigationPath();
                    console.log('parseReply reply', response, dir);
                    flm.ui.browser.setTableEntries(response.listing);


                },
                function () {
                    flm.ui.enableNavigation();
                });

    };

    flm.getFile = function (path) {
        // $("#flm-get-data [name ='dir']").val(flm.currentPath);
        $("#flm-get-data [name ='target']").val(path);
        $("#flm-get-data").submit();
    };

    flm.Refresh = function (dir) {

        if(!$type(dir) || (dir === flm.currentPath))
        {
            flm.goToPath(flm.currentPath);
        }
    };

    var instance = {
        archives: {},
        paths: [],
        curpath: '/',
        workpath: '/',

        inaction: false,
        actionlist: {},
        actionstats: 0,
        actiontoken: 0,
        actiontimeout: 0,
        actionlp: 0,
        activediag: '',
        actStart: function (diag) {

            this.makeVisbile('fMan_Console');
            var loader = './images/ajax-loader.gif';
            if (thePlugins.isInstalled('create')) {
                loader = './plugins/create/images/ajax-loader.gif';
            }
            $('#fMan_Console .buttons-list').css("background", "transparent url(" + loader + ") no-repeat 15px 2px");
            $(".fMan_Stop").attr('disabled', false);
            this.activediag = diag;
            if (this.settings.cleanlog) {
                $('#fMan_ClearConsole').click();
            } else {
                this.cmdlog("-------\n");
            }
            $(button).attr('disabled', true);

            this.cmdlog(theUILang.fStarts[diag] + "\n");

            theDialogManager.hide('fMan_' + diag);
        },

        actStop: function () {
            flm.ui.console.hideProgress();
            this.action.request('action=kill&target=' + encodeURIComponent(theWebUI.fManager.actiontoken));
            this.cleanactions();
        },

        logStart: function (message) {

            $("#flm-diag-console-stop").attr('disabled', false);

            if (flm.ui.settings.getSettingValue('cleanlog'))
            {
                flm.ui.console.clearlog();
            } else {
                flm.ui.console.logMsg("-------\n");
            }

            flm.ui.console.show(message);
            flm.ui.console.showProgress();

            flm.ui.getDialogs().hide();
        },

        logAction: function (action, text) {
            flm.ui.console.show(action + ': ' + text);
        },

        logConsole: function (action, text) {
            flm.ui.console.log(action + ': ' + text);
        },

        basedir: function (str) {

            var isdir = flm.utils.isDir(str);
            var path = flm.utils.trimslashes(str);

            var bname = path.split('/').pop();

            return ((isdir) ? bname + '/' : bname);
        },

        cleanactions: function () {

            $(".fMan_Stop").attr('disabled', true);
            clearTimeout(theWebUI.fManager.actiontimeout);
            flm.ui.console.hideProgress();
            theWebUI.fManager.activediag = '';
            theWebUI.fManager.actionlist = {};
            theWebUI.fManager.actionstats = 0;
            theWebUI.fManager.actiontoken = 0;
            theWebUI.fManager.actiontimeout = 0;
            theWebUI.fManager.actionlp = 0;
        },

        getFullPaths: function(entries) {
            for (var i = 0; i<entries.length; i++)
            {
                entries[i] = flm.getCurrentPath(entries[i]);
            }

            return entries;
        },

        Archive: function (name, ext) {

            if (!(theWebUI.fManager.actiontoken.length > 1)) {

                this.doSel('CArchive');

                $('#flm-diag-navigation-path').val(this.homedir + flm.currentPath + this.recname(name) + '.' + this.archives.types[ext]);

                var type = $('#fMan_archtype').empty();

                $.each(this.archives.types, function (index, value) {

                    var opt = '<option value="' + index + '">' + value.toUpperCase() + '</option>';
                    type.append((index == ext) ? $(opt).attr('selected', 'selected').get(0) : opt);
                });

                type.change();
            }

            this.makeVisbile('fMan_CArchive');
        },

        createT: function (target) {

            $('#path_edit').val(this.homedir + flm.currentPath + target);
            if ($('#tcreate').css('display') == 'none') {
                theWebUI.showCreate();
            }
        },

        doDelete: function (paths) {

            var deferred = $.Deferred();

            if(!$type(paths) || paths.length === 0)
            {
                deferred.reject('Empty paths');
                return deferred.promise();
            }

            this.logStart(theUILang.fStarts['delete']);

           return flm.api.removeFiles(paths)
               .then(function (response) {
                   flm.manager.logAction('delete', paths.length )
                   flm.Refresh(flm.getCurrentPath());
                   return response;
               },
               function (response) {
                   return response;
               });

        },

        doMove: function (filePaths, destination) {

            destination = $.trim(destination);

            var deferred = $.Deferred();
            flm.manager.logStart(theUILang.fStarts.move);

            if (!destination.length) {
                // flm.manager.logAction('copy', theUILang.fDiagInvalidname);
                deferred.reject( theUILang.fDiagInvalidname);
                return deferred.promise();
            }

            if(!$type(filePaths) || filePaths.length === 0)
            {
                deferred.reject('Empty paths');
                return deferred.promise();
            }

            if (!flm.utils.validname(destination)) {
                // flm.manager.logAction('copy', theUILang.fDiagInvalidname);
                deferred.reject( theUILang.fDiagInvalidname);
                return deferred.promise();
            }

            return flm.api.move(flm.manager.getFullPaths(filePaths), destination)
                .then(function (response) {
                        flm.manager.logAction('move', filePaths.length + ' files -> ' +destination)
                        flm.Refresh(flm.getCurrentPath());
                        return response;
                    },
                    function (response) {
                        return response;
                    });


        },

        createNewDir: function (dirname) {

            var ndn = $.trim(dirname);
            var deferred = $.Deferred();

            if (!ndn.length) {
                deferred.reject(theUILang.fDiagInvalidname);
                return deferred.promise();
            }

            if (this.fileExists(ndn) || this.fileExists(ndn + '/'))
            {
                deferred.reject(theUILang.fDiagAexist);
                return deferred.promise();
            }


            var lastPath = flm.utils.basedir(ndn) + "";

            return flm.api.mkDir(ndn)
                .then(function (response) {
                        flm.manager.inaction = false;

                        console.log('parseReply reply', response, ndn, dirname, flm.currentPath, lastPath);
                        if ((flm.currentPath === lastPath)
                            && !flm.manager.isErr(response.errcode, ndn)) {
                            flm.goToPath(flm.currentPath);
                        }
                        return response;
                    },
                    function (response) {
                        return response;
                    });

        },

        doCopy: function (destination, filePaths) {

          //  var path = this.checkInputs(diag);

            destination = $.trim(destination);

            var deferred = $.Deferred();
            flm.manager.logStart(theUILang.fStarts.copy);

            if (!destination.length) {
               // flm.manager.logAction('copy', theUILang.fDiagInvalidname);
                deferred.reject( theUILang.fDiagInvalidname);
                return deferred.promise();
            }

            if(!$type(filePaths) || filePaths.length === 0)
            {
                deferred.reject('Empty paths');
                return deferred.promise();
            }

            if (!flm.utils.validname(destination)) {
               // flm.manager.logAction('copy', theUILang.fDiagInvalidname);
                deferred.reject( theUILang.fDiagInvalidname);
                return deferred.promise();
            }

            return flm.api.copy(flm.manager.getFullPaths(filePaths), destination)
            .then(function (response) {
                    flm.manager.logAction('copy', filePaths.length + ' files -> ' +destination)
                    flm.Refresh(flm.getCurrentPath());
                    return response;
                },
                function (response) {
                    return response;
                });
        },

        doRename: function (source, destination) {

             source = $.trim(source);
             destination = $.trim(destination);

            var deferred = $.Deferred();

            if (!source.length || (destination === source)) {

                flm.manager.logAction('rename'.toString(), theUILang.fDiagInvalidname);

                deferred.reject(theUILang.fDiagInvalidname);
                return deferred.promise();
            }

            if (!flm.utils.validname(destination)) {
                flm.manager.logAction('rename'.toString(), theUILang.fDiagInvalidname);
                deferred.reject(theUILang.fDiagInvalidname);
                return deferred.promise();
            }

            if (theWebUI.fManager.fileExists(source)
                || theWebUI.fManager.fileExists(source + '/')) //dir check
            {
                flm.manager.logAction('rename'.toString(), theUILang.fDiagAexist);
                deferred.reject(theUILang.fDiagAexist);
                return deferred.promise();
            }

            return flm.api.rename(source, destination).then(
                    function (value) {
                       // if ((flm.currentPath == theWebUI.fManager.workpath) && !theWebUI.fManager.isErr(data.errcode, destination)) {
                            flm.manager.logAction('rename', source + ' -> ' +destination)
                            flm.Refresh(flm.utils.basedir(destination));
                       // }
                    }
            );


/*
            this.action.postRequest({action: flm.utils.json_encode(actioncall)},
                callback,
                function () {
                    log(theUILang.fErrMsg[11]);
                }, function () {
                    log(theUILang.fErrMsg[12] + ' - Rename: ' + destination);
                });*/

        },

        extract: function (what, here) {
            if (!(theWebUI.fManager.actiontoken.length > 1)) {
                $('#fMang_Archfile').html(flm.currentPath + '<strong>' + what + '</strong>');
                $('#fMan_Extractbpath').val(this.homedir + flm.currentPath + (here ? '' : this.recname(what)));
                $('#fMan_Extract .fMan_Start').attr('disabled', false);
            }

            this.makeVisbile('fMan_Extract');
        },

        fileExists: function (what) {

            var table = theWebUI.getTable("flm");
            var exists = false;

            try {
                if (table.getValueById('_flm_' + what, 'name')) {
                    throw true;
                } else {
                    throw false;
                }
            } catch (dx) {
                if (dx === true) {
                    exists = dx;
                }
            }

            return exists;
        },

        isChecked: function (diag, what) {

            var ret = false;

            $('#' + diag + ' .checklist input:checked').each(function (index, val) {
                if ((what == decodeURIComponent(val.value)) || (what + '/' == decodeURIComponent(val.value))) {
                    ret = true;
                    return false;
                }
            });

            return ret;
        },

        isErr: function (errcode, extra) {

            if (!$type(extra)) {
                extra = '';
            }

            if (errcode > 0) {
                log('FILE MANAGER: ' + theUILang.fErrMsg[errcode] + " : " + extra);
                return true;
            }

            return false;
        },

        doMediainfo: function (what) {


            var calldata = {
                'action': 'fileMediaInfo',
                'target': what,
                'dir': flm.currentPath

            };

            theWebUI.startConsoleTask("mediainfo", plugin.name, calldata, {noclose: true});


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
                        if (theWebUI.fManager.isErr(data.errcode, what)) {
                            self.cmdlog('Failed fetching data');
                            return false;
                        }
                        self.clearlog();
                        self.cmdlog(data.minfo);
                    });

                                flm.ui.console.hideProgress();*/


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

        },

        sfvCreate: function (what) {

            $('#fMan_CreateSFVbpath').val(this.homedir + flm.currentPath + this.recname(what) + '.sfv');
            theWebUI.fManager.doSel('CreateSFV');

        }

    };


    flm.views = views();
    flm.ui = userInterface();

    flm.manager = instance;

    return flm;
}

// namespace

window.flm = FileManager();
theWebUI.FileManager = window.flm.ui;
theWebUI.fManager = window.flm.manager;
