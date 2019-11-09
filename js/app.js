function FileManagerUtils() {

    var utils = {
        archive_types: ["zip", "rar", "tar", "gz", "bz2"],
        isArchive: function (element) {
            var fext = this.getExt(element);
            return (this.archive_types.indexOf(fext) > -1);

            // return fext.match(/^(zip|rar|tar|gz|bz2)$/i);
        },
        isDir: function (element) {
            return (element.charAt(element.length - 1) === '/');
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
                    if (i == 'M') {
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


        buildPath: function (parts) {

            var res = [];
            var item;
            for (var i = 0; i < parts.length; i++) {
                item = this.trimslashes(parts[i]);
                if (item !== "") {
                    res.push(item);
                }
            }
            return '/' + res.join('/');

        },
        encode_string: function (str) {

            return encodeURIComponent(this.json_encode(str));

        },

        json_encode: function (obj) {
            var self = this;
            switch ($type(obj)) {
                case "number":
                    return (String(obj));
                case "boolean":
                    return (obj ? "1" : "0");
                case "string":
                    return ('"' + obj + '"');
                case "array": {
                    var s = '';
                    $.each(obj, function (key, item) {
                        if (s.length)
                            s += ",";
                        s += self.json_encode(item);
                    });
                    return ("[" + s + "]");
                }
                case "object": {
                    var s = '';
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
        trimslashes: function (str) {

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
        },

        /*        sortAlphaNumeric: function(x, y) {

                    if (x.key.split('_flm_')[1] == theWebUI.fManager.getLastPath(flm.currentPath)) {
                        return (this.reverse ? 1 : -1);
                    }
                    return (this.oldFilesSortAlphaNumeric(x, y));
                },*/

        addslashes: function (str) {
            // http://phpjs.org/functions/addslashes:303
            return (str + '').replace(/[\\"\/]/g, '\\$&').replace(/\u0000/g, '\\0');
        },

        actionResult: function (result) {
            var isSuccess = function () {

                return result == 'succes';
            };

            return {
                isSuccess: isSuccess
            }
        },

        validname: function (what) {
            return (what.split('/').length > 1) ? false : true;
        }

    };
    utils.basename = function(what)
    {
        var arr = utils.trimslashes(what).split('/');

        var r = arr.pop();
        return r;
    };

    return utils;

};


function FileManager() {

    var flm = {};

    var pluginUrl = 'plugins/filemanager';

    var getPlugin = function () {
        return thePlugins
            .get('filemanager');
    };

    flm.utils = FileManagerUtils();
    var apiClient = function (endpoint) {

        endpoint = endpoint || getPlugin().path + 'action.php';
        return {
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
                    data: data,
                    //  contentType: "application/json",
                    dataType: "json",

                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        deferred.reject({'response': [XMLHttpRequest, textStatus, errorThrown]});
                    },
                    success: function (data) {
                        if (data.hasOwnProperty('error') && data.error) {
                            deferred.reject({'response': data});

                        } else {
                            deferred.resolve(data);
                        }
                    }
                });

                return deferred.promise();

            },
        };
    };


    var views = function () {
        self = this;
        self.viewsPath = pluginUrl + '/views';


        for (var funcName in flm.utils) {
            if ($type(flm.utils[funcName]) === "function") {
                Twig.extendFunction(funcName, flm.utils[funcName]);
            }
        }

        self.getView = function (name, fn, options) {
            //
            options = options || {};

            options.views = 'flm';
            options.theUILang = theUILang;
            options.utils= flm.utils;
            options.settings = {
                'twig options': {
                    namespaces: {'flm': viewsPath + '/'},
                    href: viewsPath + '/' + name + '.twig'
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
                ondelete: function (e) {
                    theWebUI.fManager.doSel('Delete');
                },

                format: function (table, arr) {
                    for (var i in arr) {
                        if (arr[i] == null) {
                            arr[i] = '';
                        } else {
                            switch (table.getIdByCol(i)) {
                                case 'name':
                                    if (flm.ui.browser.isTopDir(arr[i])) {
                                        arr[i] = '../';
                                    }
                                    if (theWebUI.fManager.settings.stripdirs
                                        && flm.utils.isDir(arr[i])) {
                                        arr[i] = flm.utils.trimslashes(arr[i]);
                                    }
                                    break;
                                case 'size' :
                                    if (arr[i] != '') {
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
                                    if (theWebUI.fManager.settings.permf > 1) {
                                        arr[i] = theWebUI.fManager.formatPerm(arr[i]);
                                    }
                                    break;
                            }
                        }
                    }
                    return (arr);
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

            browse.getSelection = function () {
                var selectedEntries = [];
                var rows = browse.table().rowSel;
                var entryName;
                for (var i in rows) {
                    entryName = i.split('flm')[1];
                    if ((!rows[i]) || browse.isTopDir(entryName)) {
                        continue;
                    }
                    selectedEntries.push(entryName);
                }

                return selectedEntries;

            };

            browse.loadNavigation = function () {
                if (!browse.navigationLoaded) {
                    flm.views.getView('table-header', function (view) {
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
                        },
                        {apiUrl: flm.apiClient.endpoint});
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

                    flm.workpath = flm.currentPath;

                    var fext = utils.getExt(path);

                    if (fext == 'nfo') {
                        context.add([CMENU_SEP]);
                        context.add([theUILang.fView,
                            function () {
                                flm.viewNFO(path, 1);
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
                    create_sub.push([theUILang.fcNewDir, "flm.ui.createDir()"]);
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
                    context.add([theUILang.fcNewDir, "flm.ui.createDir()"]);
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

                    if (flm.utils.isDir(file.name)) {
                        var ftype = 0;
                    } else {
                        var ftype = 1;
                    }

                    var entry = {
                        name: file.name,
                        size: file.size,
                        time: file.time,
                        type: ftype + file.name,
                        perm: file.perm
                    };

                    var hash = "_flm_" + file.name;

                    table.addRowById(entry, hash, flm.utils.getICO(file.name));

                    if (!theWebUI.fManager.settings.showhidden && (file.name.charAt(0) === '.')) {
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

                var historySize = 5;

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
            // multiple file operations are ui blocking
            forms: {
                archive: {
                    modal: true,
                    multiselect: true,
                    template: "dialog-archive"
                },
                copy: {
                    modal: true,
                    multiselect: true,
                    template: "dialog-copy"
                },
                console: {
                    template: "dialog-console"
                },
                mkdir: {
                    template: 'dialog-new-dir'
                },
                move: {
                    modal: true,
                    multiselect: true,
                    template: "dialog-move"
                },
                delete: {
                    multiselect: true,
                    template: "dialog-delete"
                },
                extract: {
                    modal: true,
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
                    template: "dialog-sfv-check"
                },
                sfv_create: {
                    modal: true,
                    hasList: true,
                    multiselect: true,
                    multiselectFilesOnly: true,
                    template: "dialog-svf_create"
                },
                nfo_view: {
                    template: "dialog-svf_check"
                }
            },

            beforeShow: function (id, what) {
                var diagId = this.getDialogId(what);
                var diags = this;
                diags.getDialogHeader(diagId);

                diags.getDialogHeader(id)
                    .empty()
                    .html(theUILang[diagId])
                    .prepend('<span class="flm-sprite-diag flm-sprite sprite-' + what + '"></span>');

                var config = this.forms[what];

                if ($type(config.modal)) {
                    theDialogManager.setModalState();
                } else {
                    theDialogManager.clearModalState();
                }

                var data = {
                    apiUrl: flm.apiClient.endpoint,
                    selectedEntries: browser.getSelection(),
                    selectedTarget: flm.getCurrentPath(browser.selectedTarget),
                    currentPath: flm.getCurrentPath('/')
                };

                flm.views.getView(config.template, function (html) {
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
                            })

                    },
                    data);
                /*
                                var forcedirs = (id == 'fMan_CreateSFV') ? true : false;
                */

                /*         if (!(theWebUI.fManager.actiontoken.length > 1)) {

                         }*/

                //   this.setMultipleSelection();

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

            enableStartButton: function (diag) {
                $('#' + diag + ' .fMan_Start').attr('disabled', false);
            },
            disableStartButton: function (diag) {
                $('#' + diag + ' .fMan_Start').attr('disabled', true);
            },

            onStart: function (callback) {
                this.onStartEvent = callback;
            },

            show: function (afterShow) {
                theDialogManager.show(this.getDialogId('window'), afterShow);
            },
            hide: function (afterHide) {
                theDialogManager.hide(this.getDialogId('window'), afterHide);
            },
            updateTargetPath: function (path) {
                return $('#flm-diag-navigation-path').val(path);
            },

            createDialogs: function () {

                /*
                 Dialogs button binds bellow:
                 */

                $('.fMan_Start').click(function () {

                    var diagid = $(this).parents('.dlg-window:first').attr('id');
                    diagid = diagid.split('fMan_');

                    switch (diagid[1]) {
                        case 'CArchive':
                            theWebUI.fManager.doArchive(this, diagid[1]);
                            break;
                        case 'CheckSFV':
                            theWebUI.fManager.showSFVcheck(this, diagid[1]);
                            break;
                        case 'CreateSFV':
                            theWebUI.fManager.showSFVcreate(this, diagid[1]);
                            break;
                        case 'Copy':
                            theWebUI.fManager.doCopy(this, diagid[1]);
                            break;
                        case 'Delete':
                            theWebUI.fManager.doDelete(this, diagid[1]);
                            break;
                        case 'Extract':
                            theWebUI.fManager.doExtract(this, diagid[1]);
                            break;
                        case 'mkdir':
                            /// theWebUI.fManager.doNewDir();
                            break;
                        case 'Move':
                            theWebUI.fManager.doMove(this, diagid[1]);
                            break;
                        case 'Rename':
                            theWebUI.fManager.doRename();
                            break;
                        case 'Screenshots':
                            theWebUI.fManager.doScreenshots(this, diagid[1]);
                            break;
                    }

                });

                $('.fMan_Stop').click(function () {

                    theWebUI.fManager.cmdlog(theUILang.fStops[theWebUI.fManager.activediag] + "\n");
                    theWebUI.fManager.actStop();

                });

                if (thePlugins.isInstalled("_getdir")) {

                    browsediags.CArchive = 'arch';
                    var closehandle = function (diagid) {
                        theDialogManager.setHandler('fMan_' + diagid, 'afterHide', function () {
                            plugin["bp" + diagid].hide();
                        });
                    };

                    for (sex in browsediags) {
                        plugin['bp' + sex] = new theWebUI.rDirBrowser('fMan_' + sex, 'fMan_' + sex + 'bpath', 'fMan_' + sex + 'bbut', null, false);
                        closehandle(sex);
                    }

                } else {
                    for (sex in browsediags) {
                        $('fMan_' + sex + 'bbut').remove();
                    }
                }


                $("#fMan_multiv").change(function () {

                    var dis = $(this).is(':checked');
                    $("#fMan_vsize").attr("disabled", !dis);
                });


                $("#fMan_nfoformat").change(function () {

                    var mode = $(this).val();
                    var nfofile = $("#fMan_nfofile").val();

                    theWebUI.fManager.viewNFO(nfofile, mode);
                });


                if (!thePlugins.isInstalled('data')) {

                    $(document.body).append($("<iframe name='datafrm'/>").css({
                        visibility: "hidden"
                    }).attr({
                        name: "datafrm",
                        id: "datafrm"
                    }).width(0).height(0).load(function () {
                        var d = (this.contentDocument || this.contentWindow.document);
                        if (d.location.href != "about:blank")
                            try {
                                eval(d.body.innerHTML);
                            } catch (e) {
                            }
                    }));
                }


            },

            getDialogId: function (what) {
                return 'flm_popup_' + what;
            },

            getDialogHeader: function (diagId) {
                return $('#' + diagId + "-header");
            },
            //makeVisbile
            showDialog: function (what, viewEvents) {

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
                        $type(diags[evName])
                        && diags[evName].apply(diags, [id, what]);

                        viewEvents.hasOwnProperty(evName)
                        && viewEvents[evName].apply(diags, [id, what]);

                    });

                });
                theDialogManager.show(diagId);

            },

            getTargetPath: function() {
                return $('#flm-diag-navigation-path').val();
            }
        };

        // file operation dialogs

        self.settings = {
            init: false,
            onShow: function (arg) {
                console.log('flm.ui.settings on Show', arg);
                // plugin config tab in UI settings

                var self = this;
                // 1 dialog is enough :)
                if (self.init) {
                    self.updateSettings();
                } else {
                    flm.views.getView('settings-pane', function (view) {
                        self.init = true;
                        getPlugin()
                            .attachPageToOptions($(view).get(0), theUILang.fManager);
                        self.updateSettings();

                    });
                }


            },
            updateSettings: function () {
                $('#fMan_optPan').find('input, select')
                    .each(function (index, ele) {
                        var inid = ele.id.split('fMan_Opt');

                        if ($(ele).attr('type') == 'checkbox') {
                            if (theWebUI.settings["webui.fManager." + inid[1]]) {
                                $(ele).attr('checked', 'checked');
                            }
                        } else if ($(ele).is("select")) {
                            $(ele).children('option[value="' + theWebUI.settings["webui.fManager." + inid[1]] + '"]').attr('selected', 'selected');
                        } else {
                            $(ele).val(theWebUI.settings["webui.fManager." + inid[1]]);
                        }
                    });

            }
        };

        self.init = function () {
            console.log('flm.ui.init', this);

            // file navigation
            self.initFileBrowser();

            // operation dialogs

            $('#fMan_ClearConsole').click(function () {
                self.cleanlog();
            });

        };

        self.cleanlog = function () {

            $('#fMan_ConsoleLog pre').empty();
        };

        self.disableNavigation = function () {
            self.browser.disableTable();
        };

        self.enableNavigation = function () {
            self.browser.enableTable();
        };

        self.initFileBrowser = function () {
            $('#tab_lcont').append('<input type="button" id="fMan_showconsole" class="Button" value="Console" style="display: none;">');
            $('#fMan_showconsole').click(function () {
                self.showConsole();
            });
            // file navigation
            browser.init();
        };

        self.formatDate = function (timestamp) {
            return flm.utils.formatDate(timestamp, this.settings.timef || '%d.%M.%y %h:%m:%s')
        };

        self.getPopupId = function (popupName) {
            return 'fMan_' + popupName;
        };

        self.createDir = function () {

            var diagId = dialogs.getDialogId('mkdir');
            dialogs.showDialog('mkdir',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();

                        $('#flm_popup_mkdir-currentpath').text(currentPath);
                        $('#flm_popup_mkdir .fMan_Start').click(function () {
                            var dirname = $('#fMan-ndirname').val();

                            if (!flm.utils.validname(dirname)) {
                                alert(theUILang.fDiagInvalidname);
                                return;
                            }
                            dirname = flm.utils.buildPath([currentPath, dirname]);

                            flm.manager.createNewDir(dirname).then(
                                function () {
                                    theDialogManager.hide(diagId);

                                },
                                function (reason) {
                                    console.log(reason);
                                    log(reason);
                                    theDialogManager.hide(diagId);

                                }
                            );
                        });
                    },
                    afterShow: function () {
                        console.log('mkdir diag shown');
                    }
                });
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

        self.showArchive = function (button) {
            var diagId = dialogs.getDialogId('archive');


            dialogs.showDialog('archive',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();
                        var ext = 'zip';
                        $('#flm-diag-navigation-path').val(flm.currentPath + flm.manager.recname(name) + '.' + ext);

                        /*  var type = $('#fMan_archtype').empty();

                          $.each(flm.utils.archive_types, function(index, value) {
                              type.append((value === ext) ? $(opt).attr('selected', 'selected').get(0) : opt);
                          });

                          type.change();
  */

                        $("#fMan_archtype").change(function () {

                            var type = $(this).val();
                            var comp = $("#fMan_archcompr");

                            var ext;

                            switch (flm.utils.archive_types[type]) {
                                case 'gzip':
                                    ext = 'tar.gz';
                                    break;
                                case 'bzip2':
                                    ext = 'tar.bz2';
                                    break;
                                default:
                                    ext = flm.utils.archive_types[type];
                            }

                            //   $('#flm-diag-navigation-path').val(
                            //
                            //   );

                            dialogs.updatePath(flm.manager.recname(flm.manager.recname($('#flm-diag-navigation-path').val())) + '.' + ext);
                            ;
                            $("#fMan_vsize").attr("disabled", (!$("#fMan_multiv").attr("disabled", (type != 0)).is(':checked') || (type != 0)));
                            $('#fMan_apassword').attr("disabled", (type != 0));
                            comp.empty();

                            for (var i = 0; i < theWebUI.fManager.archives.compress[type].length; i++) {
                                comp.append('<option value="' + i + '">' + theUILang.fManArComp[type][i] + '</option>');
                            }

                        });

                        $('#flm_popup_mkdir-currentpath').text(currentPath);
                        $('#flm_popup_mkdir .fMan_Start').click(function () {


                            var archive = this.checkInputs(diag);
                            if (archive === false) {
                                return false;
                            }

                            var type = $("#fMan_archtype").val();
                            var vsize = ((this.archives.types[type] != 'zip') && $("#fMan_multiv").is(':checked') && $("#fMan_vsize").val().match(/^\d+$/)) ? $("#fMan_vsize").val() : 0;
                            var compression = $('#fMan_archcompr').val();
                            var password = $('#fMan_apassword').val();

                            var self = this;

                            var options = {
                                format: self.settings.arcnscheme,
                                type: type,
                                compression: compression,
                                vsize: vsize,
                                password: password
                            };


                            var dirname = $('#fMan-ndirname').val();

                            if (!flm.utils.validname(dirname)) {
                                alert(theUILang.fDiagInvalidname);
                                return;
                            }
                            dirname = flm.utils.buildPath([currentPath, dirname]);

                            flm.manager.doArchive(entries).then(
                                function () {
                                    theDialogManager.hide(diagId);

                                },
                                function (reason) {
                                    console.log(reason);
                                    log(reason);
                                    theDialogManager.hide(diagId);

                                }
                            );
                        });
                    },
                    afterShow: function () {
                        console.log('mkdir diag shown');
                    }
                });


            if (this.fileExists(this.basedir(archive + '/'))) {
                alert(theUILang.fDiagArchempty);
                return false;
            }

            if (!this.buildList('fMan_' + diag)) {
                return false;
            }


            $(button).attr('disabled', true);
            this.actStart(diag);

            var actioncall = {
                method: 'filesCompress',
                target: archive,
                mode: options,
                fls: theWebUI.fManager.actionlist
            };

            this.action.postRequest({action: flm.utils.json_encode(actioncall)});

        };
        self.showCopy = function (button) {
            var diagId = dialogs.getDialogId('copy');

            dialogs.showDialog('copy',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();

                        dialogs.onStart(function () {
                            var dirname = dialogs.getTargetPath();

                            if (!flm.utils.validname(dirname)) {
                                alert(theUILang.fDiagInvalidname);
                                return;
                            }
                            dirname = flm.utils.buildPath([currentPath, dirname]);

                            flm.manager.doCopy(dirname).then(
                                function () {
                                    theDialogManager.hide(diagId);

                                },
                                function (reason) {
                                    console.log(reason);
                                    log(reason);
                                    theDialogManager.hide(diagId);

                                }
                            );
                        });
                    },
                    afterShow: function () {
                        console.log('copy diag shown');
                    }
                });


        };

        self.showConsole = function () {
            var diagId = dialogs.getDialogId('console');
            var config = dialogs.forms['console'];

            // create it
            if (!theDialogManager.items.hasOwnProperty(diagId)) {

                flm.views.getView(config.template, function (html) {

                    theDialogManager.make(diagId, theUILang.flm_popup_console,
                        $(html).get(0),
                        config.modal); // prevent the user from changing table selection by default


                    theDialogManager.setHandler(diagId, 'beforeShow', function (id) {
                        $('#flm-diag-stop').click(function () {
                            console.log('Current action stop triggered from console diags');

                        });

                    });

                    theDialogManager.setHandler(diagId, 'afterHide', function () {
                        console.log('console diag closed');
                    });

                    theDialogManager.show(diagId);

                });
            } else {
                theDialogManager.show(diagId);
            }

        };

        self.showMove = function (button) {
            var diagId = dialogs.getDialogId('move');


            dialogs.showDialog('move',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();

                        $('#flm_popup_mkdir .fMan_Start').click(function () {
                            var dirname = $('#fMan-ndirname').val();

                            if (!flm.utils.validname(dirname)) {
                                alert(theUILang.fDiagInvalidname);
                                return;
                            }
                            dirname = flm.utils.buildPath([currentPath, dirname]);

                            flm.manager.doCopy(dirname).then(
                                function () {
                                    theDialogManager.hide(diagId);

                                },
                                function (reason) {
                                    console.log(reason);
                                    log(reason);
                                    theDialogManager.hide(diagId);

                                }
                            );
                        });
                    },
                    afterShow: function () {
                        console.log('mkdir diag shown');
                    }
                });

            var path = this.checkInputs(diag);

            if (path === false) {
                return false;
            }
            if (!this.buildList('fMan_' + diag)) {
                return false;
            }

            $(button).attr('disabled', true);

            this.actStart(diag);

            var actioncall = {
                method: 'filesCopy',
                to: path,
                fls: theWebUI.fManager.actionlist
            };


            return flm.api.copy(target, destination)
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


            this.action.postRequest({
                action: flm.utils.json_encode(actioncall)
            });

            //this.action.request('action=cp&to='+encodeURIComponent(path)+'&fls='+this.encode_string(theWebUI.fManager.actionlist));
        },
        self.showPermissions = function (button) {
                var diagId = dialogs.getDialogId('permissions');


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

            },
        self.showRename = function (button) {
            var diagId = dialogs.getDialogId('rename');


            dialogs.showDialog('rename',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();

                        dialogs.onStart(function () {
                            var dirname = $('#fMan-ndirname').val();


                        });
                    },
                    afterHide: function () {
                        console.log('rename closed');
                    }
                });

        },
        self.showExtract = function (button, diag) {
            var diagId = dialogs.getDialogId('extract');


            dialogs.showDialog('extract',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();

                        $('#flm_popup_mkdir-currentpath').text(currentPath);
                        $('#flm_popup_mkdir .fMan_Start').click(function () {
                            var dirname = $('#fMan-ndirname').val();

                            if (!flm.utils.validname(dirname)) {
                                alert(theUILang.fDiagInvalidname);
                                return;
                            }
                            dirname = flm.utils.buildPath([currentPath, dirname]);

                            flm.manager.doCopy(dirname).then(
                                function () {
                                    theDialogManager.hide(diagId);

                                },
                                function (reason) {
                                    console.log(reason);
                                    log(reason);
                                    theDialogManager.hide(diagId);

                                }
                            );
                        });
                    },
                    afterShow: function () {
                        console.log('mkdir diag shown');
                    }
                });

            var path = this.checkInputs(diag, true);
            if (path === false) {
                return false;
            }

            var archive = $('#fMang_Archfile').text();

            $(button).attr('disabled', true);

            this.actStart(diag);

            var actioncall = {
                method: 'fileExtract',
                target: archive,
                to: path
            };

            this.action.postRequest({action: flm.utils.json_encode(actioncall)});
        };

        self.showSFVcheck = function (button, diag) {
            var diagId = dialogs.getDialogId('sfv_check');


            dialogs.showDialog('sfv_check',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();

                        $('#flm_popup_mkdir-currentpath').text(currentPath);
                        $('#flm_popup_mkdir .fMan_Start').click(function () {
                            var dirname = $('#fMan-ndirname').val();

                            if (!flm.utils.validname(dirname)) {
                                alert(theUILang.fDiagInvalidname);
                                return;
                            }
                            dirname = flm.utils.buildPath([currentPath, dirname]);

                            flm.manager.doCopy(dirname).then(
                                function () {
                                    theDialogManager.hide(diagId);

                                },
                                function (reason) {
                                    console.log(reason);
                                    log(reason);
                                    theDialogManager.hide(diagId);

                                }
                            );
                        });
                    },
                    afterShow: function () {
                        console.log('mkdir diag shown');
                    }
                });
            var sfvfile = $('#fMang_ChSFVfile').text();
            $(button).attr('disabled', true);

            var fparts = sfvfile.split('/');

            this.actStart(diag);


            var actioncall = {
                method: 'svfCheck',
                target: fparts.pop()
            };


            this.action.postRequest({action: flm.utils.json_encode(actioncall)});


        };

        self.showSFVcreate = function (button, diag) {
            var diagId = dialogs.getDialogId('sfv_create');


            dialogs.showDialog('sfv_create',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();

                        $('#flm_popup_mkdir-currentpath').text(currentPath);
                        $('#flm_popup_mkdir .fMan_Start').click(function () {
                            var dirname = $('#fMan-ndirname').val();

                            if (!flm.utils.validname(dirname)) {
                                alert(theUILang.fDiagInvalidname);
                                return;
                            }
                            dirname = flm.utils.buildPath([currentPath, dirname]);

                            flm.manager.doCopy(dirname).then(
                                function () {
                                    theDialogManager.hide(diagId);

                                },
                                function (reason) {
                                    console.log(reason);
                                    log(reason);
                                    theDialogManager.hide(diagId);

                                }
                            );
                        });
                    },
                    afterShow: function () {
                        console.log('mkdir diag shown');
                    }
                });
            var file = this.checkInputs(diag);
            if (file === false) {
                return false;
            }
            if (this.fileExists(this.basedir(file + '/'))) {
                alert(theUILang.fDiagSFVempty);
                return false;
            }

            if (!this.buildList('fMan_' + diag)) {
                return false;
            }

            $(button).attr('disabled', true);
            this.actStart(diag);


            var actioncall = {
                method: 'sfvCreate',
                target: file,
                fls: theWebUI.fManager.actionlist
            };


            this.action.postRequest({action: flm.utils.json_encode(actioncall)});

        };

        self.showDelete = function () {
            var diagId = dialogs.getDialogId('delete');

            dialogs.showDialog('delete',
                {
                    beforeShow: function () {

                        var currentPath = flm.getCurrentPath();

                        $('#flm_popup_mkdir-currentpath').text(currentPath);
                        $('#flm_popup_mkdir .fMan_Start').click(function () {
                            var dirname = $('#fMan-ndirname').val();

                            if (!flm.utils.validname(dirname)) {
                                alert(theUILang.fDiagInvalidname);
                                return;
                            }
                            dirname = flm.utils.buildPath([currentPath, dirname]);

                            flm.manager.doCopy(dirname).then(
                                function () {
                                    theDialogManager.hide(diagId);

                                },
                                function (reason) {
                                    console.log(reason);
                                    log(reason);
                                    theDialogManager.hide(diagId);

                                }
                            );
                        });
                    },
                    afterShow: function () {
                        console.log('mkdir diag shown');
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


    flm.apiClient = apiClient();
    flm.currentPath = '/';


    flm.getCurrentPath = function (file) {
        var path = flm.currentPath + "";
        if (file !== undefined) {
            file = file.length > 0 && flm.utils.trimslashes(file) || '';
            path = flm.utils.buildPath([path, file]);

        }
        return path;

    };


    flm.api = {

        promise: null,
        currentPath: null,
        getDir: function (dir, callback) {

            var data = {
                'method': 'listDirectory',
                'dir': dir
            };

            return flm.apiClient.post({action: flm.utils.json_encode(data)})
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
                );
        },

        mkDir: function(dir) {

            var data = {
                method: 'newDirectory',
                target: dir
            };

            return flm.apiClient.post({action: flm.utils.json_encode(data)})
                .then(
                    function (response) {
                        return response;
                    },
                    function (response) {
                        // log(theUILang.fErrMsg[9]);
                        console.error(response);

                        log(theUILang.fErrMsg[4] + ' - ' + dir);
                        return response;
                    }
                );

        },
        stats: function (diag) {

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
                    if (flm.currentPath == theWebUI.fManager.workpath) {
                        theWebUI.fManager.Refresh();
                    }
                }
            };


            theWebUI.fManager.action.postRequest({
                action: flm.utils.json_encode(actioncall)
            }, responseHandle);

        }
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

    var instance = {
        archives: {},
        paths: [],
        curpath: '/',
        workpath: '/',
        settings: {
            timef: '%d-%M-%y %h:%m:%s',
            permf: 1,
            histpath: 5,
            stripdirs: true,
            showhidden: true,
            cleanlog: false,
            arcnscheme: 'new',
            scrows: 12,
            sccols: 4,
            scwidth: 300
        },
        pathlists: 5,
        permf: 0,
        tformat: '%d-%M-%y %h:%m:%s',
        inaction: false,
        actionlist: {},
        actionstats: 0,
        actiontoken: 0,
        actiontimeout: 0,
        actionlp: 0,
        activediag: '',
        homedir: '',

        forms: {},
        actionCheck: function (diag) {

            return function () {
            };

            if ((this.actiontimeout > 0) && (this.activediag != diag)) {
                return null;
            }

            if (!this.forms[diag].hasOwnProperty('funct')) {
                return null;
            }

            var args = "";

            var i = (arguments.length > 1) ? 1 : 0;

            for (i = i; i < arguments.length; i++) {

                var rg;

                switch ($type(arguments[i])) {
                    case 'string':
                        rg = '"' + flm.utils.addslashes(arguments[i]) + '"';

                        break;
                    default:
                        rg = arguments[i];
                }

                args += rg + ($type(arguments[i + 1]) ? ',' : '');

            }


            return 'theWebUI.fManager.' + this.forms[diag].funct + '(' + args + ')';

        },

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

            this.cmdlog(theUILang.fStarts[diag] + "\n");

            theDialogManager.hide('fMan_' + diag);
        },

        actStop: function () {
            this.loaderHide();
            this.action.request('action=kill&target=' + encodeURIComponent(theWebUI.fManager.actiontoken));
            this.cleanactions();
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

        basedir: function (str) {

            var isdir = flm.utils.isDir(str);
            var path = flm.utils.trimslashes(str);

            var bname = path.split('/').pop();

            return ((isdir) ? bname + '/' : bname);
        },

        buildList: function (diag) {

            var checks = $('#' + diag + ' .checklist input:checked');
            if (checks.size() == 0) {
                alert("Nothing is not a option");
                return false;
            }

            checks.each(function (index, val) {
                theWebUI.fManager.actionlist[index] = flm.utils.addslashes(decodeURIComponent(val.value));

            });

            return true;
        },


        cleanactions: function () {

            $(".fMan_Stop").attr('disabled', true);
            clearTimeout(theWebUI.fManager.actiontimeout);
            this.loaderHide();
            theWebUI.fManager.activediag = '';
            theWebUI.fManager.actionlist = {};
            theWebUI.fManager.actionstats = 0;
            theWebUI.fManager.actiontoken = 0;
            theWebUI.fManager.actiontimeout = 0;
            theWebUI.fManager.actionlp = 0;
        },


        cmdlog: function (text) {

            var console = $('#fMan_ConsoleLog');

            if (browser.isIE) {
                console.innerHTML = "<pre>" + console.html() + text + "</pre>";
            } else {
                console.children('pre').append(text);
            }

            console[0].scrollTop = console[0].scrollHeight;
        },

        changedir: function (target) {

            var dir;

            if (target == flm.utils.basedir(flm.currentPath)) {
                dir = flm.utils.basedir(flm.currentPath);
            } else if (target == '/') {
                dir = target;
            } else {
                dir = flm.currentPath + target;
            }

            this.action.getlisting(dir);
        },

        Copy: function (diag) {
            $('#fMan_' + diag + 'bpath').val(this.homedir + flm.currentPath);
            this.doSel(diag);

        },


        createScreenshots: function (target) {

            if (!(theWebUI.fManager.actiontoken.length > 1)) {

                $('#fMan_Screenshotslist').html(flm.currentPath + '<strong>' + target + '</strong>');
                $('#fMan_Screenshotsbpath').val(this.homedir + flm.currentPath + 'screens_' + this.recname(target) + '.png');
                $('#fMan_Screenshots .fMan_Start').attr('disabled', false);
            }

            this.makeVisbile('fMan_Screenshots');
        },

        createT: function (target) {

            $('#path_edit').val(this.homedir + flm.currentPath + target);
            if ($('#tcreate').css('display') == 'none') {
                theWebUI.showCreate();
            }
        },


        doDelete: function (button, diag) {

            if (!this.buildList('fMan_' + diag)) {
                return false;
            }

            $(button).attr('disabled', true);

            this.actStart(diag);

            var actioncall = {
                method: 'filesRemove',
                fls: theWebUI.fManager.actionlist
            };

            this.action.postRequest({action: flm.utils.json_encode(actioncall)});

        },

        doMove: function (button, diag) {

            var path = this.checkInputs(diag);

            if (path === false) {
                return false;
            }
            if (!this.buildList('fMan_' + diag)) {
                return false;
            }

            $(button).attr('disabled', true);


            this.actStart(diag);

            var actioncall = {
                method: 'filesMove',
                to: path,
                fls: theWebUI.fManager.actionlist
            };

            this.action.postRequest({
                action: flm.utils.json_encode(actioncall)
            });

        },

        createNewDir: function (dirname) {

            var deferred = $.Deferred();

            var ndn = $.trim(dirname);


            if (!ndn.length) {
                deferred.reject(theUILang.fDiagInvalidname);
                return deferred.promise();
            }

            if (this.fileExists(ndn) || this.fileExists(ndn + '/')) {
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

        // 'do' prefix denotes an async operation
        doCopy: function (button, diag) {

            var path = this.checkInputs(diag);

            if (path === false) {
                return false;
            }
            if (!this.buildList('fMan_' + diag)) {
                return false;
            }

            $(button).attr('disabled', true);

            this.actStart(diag);

            var actioncall = {
                method: 'filesCopy',
                to: path,
                fls: theWebUI.fManager.actionlist
            };


            return flm.api.copy(target, destination)
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


            this.action.postRequest({
                action: flm.utils.json_encode(actioncall)
            });

            //this.action.request('action=cp&to='+encodeURIComponent(path)+'&fls='+this.encode_string(theWebUI.fManager.actionlist));
        },


        doRename: function () {

            var nn = $.trim($('#fMan-RenameTo').val());
            var on = this.basedir($('#fMan-RenameWhat').text());

            if (!nn.length || (on == nn)) {
                theDialogManager.hide('fMan_Rename');
                return false;
            }
            if (!flm.utils.validname(nn)) {
                alert(theUILang.fDiagInvalidname);
                return false;
            }

            if (theWebUI.fManager.fileExists(nn) || theWebUI.fManager.fileExists(nn + '/')) {
                alert(theUILang.fDiagAexist);
                return false;
            }

            var callback = function (data) {
                if ((flm.currentPath == theWebUI.fManager.workpath) && !theWebUI.fManager.isErr(data.errcode, on)) {
                    theWebUI.fManager.Refresh();
                }
                theDialogManager.hide('fMan_Rename');
            };

            var actioncall = {
                method: 'fileRename',
                target: on,
                to: nn,
                fls: theWebUI.fManager.actionlist
            };


            this.action.postRequest({action: flm.utils.json_encode(actioncall)},
                callback,
                function () {
                    log(theUILang.fErrMsg[11]);
                }, function () {
                    log(theUILang.fErrMsg[12] + ' - Rename: ' + on);
                });

        },

        doScreenshots: function (button, diag) {

            var screen_file = this.checkInputs(diag);
            if (screen_file === false) {
                return false;
            }

            var video = $('#fMan_Screenshotslist').text();

            $(button).attr('disabled', true);

            this.actStart(diag);

            this.action.request('action=scrn&target=' + encodeURIComponent(video) + '&to=' + encodeURIComponent(screen_file));


            var actioncall = {
                method: 'fileScreenSheet',
                target: video,
                to: screen_file
            };


            this.action.postRequest({action: flm.utils.json_encode(actioncall)});


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

        formatPerm: function (octal) {

            var pmap = ['-', '-xx', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
            var arr = octal.split('');

            var out = '';

            for (i = 0; i < arr.length; i++) {
                out += pmap[arr[i]];
            }
            return out;

        },

        Init: function () {

            this.loadConfig();
            this.optSet(); // plugins settings page

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


        loadConfig: function () {
            var call = {
                method: 'getConfig'
            };

            var self = this;

            var callback = function (data) {

                console.log('got config data');
                console.log(data);

                for (var i in data) {

                    self[i] = data[i];
                }

                console.log(theWebUI.fManager);

                setTimeout(
                    function () {
                        instance.Refresh();

                    }, 1000
                );

            };

            this.action.postRequest({action: flm.utils.json_encode(call)}, callback);

        },

        loaderHide: function () {

            $('#fMan_Console .buttons-list').css("background", "none");
        },


        doMediainfo: function (what) {


            var calldata = {
                'action': 'fileMediaInfo',
                'target': what,
                'dir': flm.currentPath

            };

            theWebUI.startConsoleTask("mediainfo", plugin.name, calldata, {noclose: true});


            /*
            this.cleanlog();
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
                        self.cleanlog();
                        self.cmdlog(data.minfo);
                    });

                    this.loaderHide();*/


        },

        optSet: function () {

            if (theWebUI.configured) {
                uiTable.Init(); // table init

                var needsave = false;

                for (var set in theWebUI.fManager.settings) {
                    if ($type(theWebUI.settings["webui.fManager." + set])) {
                        theWebUI.fManager.settings[set] = theWebUI.settings["webui.fManager." + set];
                    } else {
                        theWebUI.settings["webui.fManager." + set] = theWebUI.fManager.settings[set];
                        needsave = true;
                    }
                }

                if (needsave) {
                    theWebUI.save();
                }

            } else {
                setTimeout(arguments.callee, 500);
            }
        },

        parseReply: function (reply, dir) {


        },

        Refresh: function () {

            this.action.getlisting(flm.currentPath);
        },

        rename: function (what) {

            var type = (flm.utils.isDir(what)) ? 'Directory:' : 'File:';
            what = flm.utils.trimslashes(what);

            $('#fMan-RenameType strong').text(type);
            $('#fMan-RenameWhat').html(flm.currentPath + '<strong>' + what + '</strong>');
            $('#fMan-RenameTo').val(what);

            this.makeVisbile('fMan_Rename');

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

        },

        sfvCheck: function (what) {

            if (!(theWebUI.fManager.actiontoken.length > 1)) {
                $('#fMang_ChSFVfile').html(flm.currentPath + '<strong>' + what + '</strong>');
                $('#fMan_CheckSFV .fMan_Start').attr('disabled', false);
            }

            this.makeVisbile('fMan_CheckSFV');
        },


        TableRegenerate: function () {
            var td = theWebUI.getTable("flm").rowdata;
            var old = {};

            var x = 0;

            for (i in td) {
                if (td[i].icon == 'flm-sprite-dir_up') {
                    continue;
                }
                old[x] = {
                    name: td[i].data[0],
                    size: td[i].data[1],
                    time: td[i].data[2],
                    type: td[i].data[3],
                    perm: td[i].data[4]
                };
                x++;
            }

            this.TableData(old);
        },


        viewNFO: function (what, mode) {

            this.makeVisbile('fMan_Nfo');
            $("#fMan_nfoformat option[value='" + mode + "']").attr('selected', 'selected');

            var cont = $('#nfo_content pre');
            cont.empty();
            cont.text('			Loading...');

            $("#fMan_nfofile").val(what);


            var actioncall = {
                method: 'viewNfo',
                target: what,
                mode: mode
            };

            var callback = function (data) {

                if (theWebUI.fManager.isErr(data.errcode, what)) {
                    cont.text('Failed fetching .nfo data');
                    return false;
                }

                if (browser.isIE) {
                    document.getElementById("nfo_content").innerHTML = "<pre>" + data.nfo + "</pre>";
                } else {
                    cont.html(data.nfo);
                }

            };

            this.action.postRequest({action: flm.utils.json_encode(actioncall)}, callback);

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


