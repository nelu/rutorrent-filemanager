import {FileManagerUtils} from "./utils.js";

export function userInterface(flm) {

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
                            .attachPageToOptions($('<div id="flm-settings-pane">' + view + '</div>').get(0), theUILang.fManager);

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

        browse.onHide = function (id) {
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
                && !browse.isTopDir(browse.selectedTarget)) {
                flm.ui.getDialogs().showDialog('rename')
            }
        };

        browse.onSetEntryMenu = function (call) {
            $(document).on(flm.EVENTS.entryMenu, function (e, menu, path) {
                call(menu, path);
            });

        };

        browse.getEntryMenu = function (target, entries) {

            var utils = FileManagerUtils(theWebUI.FileManager);
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
                return function (x, y) {

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
            diag = diag ? '#' + flm.utils.ltrim(diag, '#') : this.getDialogId(diag);
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
            path = flm.manager.addJailPath([path])[0]
            return ele[0].tagName.toLowerCase() === 'input' ? ele.val(path) : ele.text(path);
        },

        dirBrowserInput: function (diagId) {
            diagId = '#' + flm.utils.ltrim(diagId, '#');
            return $(diagId + '.dlg-window .flm-diag-nav-path');
        },

        setDirBrowser: function (diagId, withFiles) {
            var inputSelectors = $(diagId + ' .flm-diag-nav-path');

            diagId = flm.utils.ltrim(diagId, '#');

            if (thePlugins.isInstalled("_getdir")) {
                if (!this.dirBrowser.hasOwnProperty(diagId)) {
                    this.dirBrowser[diagId] = []
                }
                for (var i = 0; i < inputSelectors.length; i++) {
                    this.dirBrowser[diagId][i] = new theWebUI.rDirBrowser(inputSelectors[i].id, withFiles);

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

    self.getFilesTabMenu = (currentTorrentDirPath, selectedName, selectedPath, selectedEntries) => {

        self.browser.selectedTarget = selectedPath;
        self.browser.selectedEntries = selectedEntries;
        let fileManagerSubmenu = [];


        fileManagerSubmenu = self.browser.getEntryMenu(selectedName, selectedEntries);

        $(document).trigger(flm.EVENTS.entryMenu, [fileManagerSubmenu, selectedPath]);

        var remove = [theUILang.fOpen, //theUILang.fCopy,
            theUILang.fMove, theUILang.fDelete, theUILang.fRename, theUILang.fcNewDir,

            theUILang.fMediaI, theUILang.fRefresh];
        var subCreateMenu = null;

        fileManagerSubmenu = jQuery.grep(fileManagerSubmenu, function (menuEntry) {

            if (menuEntry[0] === CMENU_SEP) {
                return false;
            }

            if (menuEntry[1] === theUILang.fcreate) {
                //subCreateMenuPos = lastElement+"";
                subCreateMenu = menuEntry[2];
                return false;
            }

            var inRemove = remove.indexOf(menuEntry[0]);
            return (inRemove < 0);
        });

        fileManagerSubmenu = fileManagerSubmenu.concat(subCreateMenu);

        // round 2 of filtering :\
        // with entries from create sub menu
        fileManagerSubmenu = jQuery.grep(fileManagerSubmenu, function (menuEntry) {
            var inRemove = remove.indexOf(menuEntry[0]);
            return (inRemove < 0);
        });

        fileManagerSubmenu.unshift([theUILang.fOpen, function () {
            flm.showPath(currentTorrentDirPath, selectedName);
        }]);

        return fileManagerSubmenu;
    }

    self.init = function () {

        // file navigation
        self.initFileBrowser();
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

}