export function FsBrowser(fm) {
    let self = this;

    this.tableEntryPrefix = "_flm_";
    this.uiTable = $('#' + fm.getPlugin().ui.fsBrowserTableContainer + ' table');
    this.clipaboardEvent = null;
    this.clipboardEntries = [];
    this.selectedEntries = [];
    this.selectedTarget = null;
    this.navigationLoaded = false;

    var isVisible = false;


    const ctrlKey = 17,
        rightMouseKey = 2,
        vKey = 86,
        xKey = 88,
        cKey = 67,
        f2key = 113,
        cmdKey = 91;

    var bindKeys = function () {
        let ctrlDown = false;

        $(document).keydown(function (e) {
            if (e.keyCode === ctrlKey || e.keyCode === cmdKey) ctrlDown = true;
        }).keyup(function (e) {
            if (e.keyCode === ctrlKey || e.keyCode === cmdKey) ctrlDown = false;
        });

        $("#" + flm.getPlugin().ui.fsBrowserTableContainer).keydown(function (e) {
            if (ctrlDown && (e.keyCode === vKey || e.keyCode === cKey || e.keyCode === xKey)) return false;
        });

        // Document Ctrl + C/V/X
        $(document).keydown((e) => self.handleKeyCombo(e, ctrlDown));

    };

    this.init = function () {
        self.updateUiTable();
        self.setSorting();
        bindKeys();
        self.loadNavigation();
    };

    this.isVisible = function () {
        return isVisible;
    };

    // up dir path check
    this.isTopDir = function (path) {
        var parentDir = flm.utils.basedir(flm.currentPath);
        return (path === parentDir);
    };

    this.disableTable = function () {
        self.uiTable.addClass('disabled_table');
    };

    this.enableTable = function () {
        self.uiTable.removeClass('disabled_table');
    };

    this.disableRefresh = function () {
        $('#flm-nav-refresh').attr('disabled', true);
    };

    this.enableRefresh = function () {
        $('#flm-nav-refresh').attr('disabled', false);
    };

    this.fileExists = function (what) {

        var exists = false;
        what = flm.utils.basename(what);

        var checkInTable = function (path) {

            try {
                return (self.table().getValues(self.tableEntryPrefix + path));
            } catch (dx) {
                flm.debug(dx);
            }

            return exists;
        };

        return (checkInTable(what) || checkInTable(what + '/'));
    };

    this.getSelectedTarget = function () {
        return self.selectedTarget;
    };

    this.setSelectedTarget = function (target) {
        self.selectedTarget = target;
        return self;
    }

    self.setSelectedEntry = (id) => {
        const entry = id.split(self.tableEntryPrefix)[1];
        self.setSelectedTarget(!self.isTopDir(entry) ? flm.getCurrentPath(entry) : entry);
        return entry;
    }

    this.getSelection = function (fullpath) {
        fullpath = fullpath || false;
        var selectedEntries = [];
        var rows = self.table().rowSel;
        var entryName;
        for (var i in rows) {
            entryName = i.split(self.tableEntryPrefix)[1];
            if ((!rows[i]) || self.isTopDir(entryName)) {
                continue;
            }
            if (fullpath) {
                entryName = flm.getCurrentPath(entryName);
            }
            selectedEntries.push(entryName);
        }

        return selectedEntries;

    };

    this.recommendedFileName = function (ext, desiredExt) {
        // use the current dir name as base if multiple files are selected
        desiredExt = desiredExt || ext
        let file = self.selectedEntries.length > 1 && !self.isTopDir(flm.getCurrentPath())
            ? flm.getCurrentPath()
            : self.getSelectedTarget()

        file = ext ? flm.utils.stripFileExtension(file, ext) + '.' + desiredExt : '';
        return file;
    };

    this.loadNavigation = function () {
        if (!self.navigationLoaded) {
            flm.views.loadView({
                    template: 'table-header',
                    options: {apiUrl: flm.api.endpoint}
                },
                function (view) {
                    self.navigationLoaded = true;
                    var plugin = flm.getPlugin();
                    $('#' + plugin.ui.fsBrowserContainer).prepend(view);
                }
            );
        }
    };

    this.onShow = function () {
        if (isVisible) {
            return;
        }
        isVisible = true;

        if (!flm.currentPath) {
            var table = self.table();
            if (table) {
                flm.goToPath('/').then(function () {
                    theWebUI.resize();
                    // display table columns
                    table.refreshRows();
                    flm.triggerEvent('browserVisible', [self]);
                });
            }
        } else {
            flm.triggerEvent('browserVisible', [self]);
        }
    };

    this.onHide = function () {
        flm.ui.console.btn().hide();
        isVisible = false;
    };

    self.handleDeleteEntry = () => {
        self.selectedEntries = self.getSelection();
        flm.ui.getDialogs().showDialog('delete');
    }

    self.handleOpenEntry = (row) => {
        self.setSelectedEntry(row.id)
        self.open(self.selectedTarget);
    }

    // executed outside the browse/this scope
    this.handleSelectEntry = function (e, id) {
        // handles right/left click events
        if ($type(id) && (e.button === rightMouseKey)) {
            self.setSelectedEntry(id);

            theContextMenu.clear();
            self.selectedEntries = self.getSelection(false);

            var menuEntries = self.getEntryMenu(self.selectedTarget, self.selectedEntries);
            flm.triggerEvent('entryMenu', [menuEntries, self.selectedTarget]);

            $.each(menuEntries, function (index, value) {
                theContextMenu.add(value);
            });

            theContextMenu.show();
        } else {
            // normal click - focus
        }
    };

    this.handleKeyCombo = function (e, ctrlDown) {
        if (self.isVisible() && theDialogManager.visible.length === 0) {
            // only if the tab is visible and no dialogs are open
            if (ctrlDown) {
                const setClipboard = (evType) => {
                    self.clipaboardEvent = evType;
                    self.clipboardEntries = self.getSelection(true);
                    flm.actions.notify(theUILang.fManager + ": " + self.clipboardEntries.length + " in clipboard");
                }
                switch (e.keyCode) {
                    case cKey:
                        setClipboard('copy');
                        break;
                    case xKey:
                        setClipboard('move');
                        break;
                    case vKey:
                        self.handleKeyPaste()
                        break;

                }
            } else if (e.keyCode === f2key) {
                self.handleKeyRename();
            }
        }

    };

    this.handleKeyPaste = function () {
        if (self.clipaboardEvent) {
            self.selectedEntries = self.clipboardEntries;
            self.clipboardEntries = [];
            self.selectedTarget = null;
            flm.ui.getDialogs().showDialog(self.clipaboardEvent)
        }
    };

    this.handleKeyRename = function () {
        if (self.selectedEntries.length === 1
            && self.selectedTarget
            && !self.isTopDir(self.selectedTarget)) {
            flm.ui.getDialogs().showDialog('rename')
        }
    };

    this.onContextMenu = function (call) {
        flm.onEvent('entryMenu', (e, menu, path) => {
            call(menu, path);
        });
    };

    this.getEntryMenu = function (target, entries) {
        let flm = theWebUI.FileManager;
        let utils = flm.utils;
        let dialogs = flm.ui.dialogs;

        var pathIsDir = utils.isDir(target);
        var menu = [];

        menu.push([
            theUILang.fOpen,
            (entries.length > 1) ? null : function () {
                self.open(target);
            }]);

        if (!self.isTopDir(target)) {

            var fext = utils.getExt(target);

            if (flm.utils.isTextfile(fext)) {
                menu.push([theUILang.fView, () => {
                    flm.ui.viewNFO(target);
                }]);
                menu.push([CMENU_SEP]);
            }

            // create submenu
            var create_sub = [];

            create_sub.push([theUILang.fcNewTor, thePlugins.isInstalled('create') && entries.length ? function () {

                flm.actions.createTorrent(target);
            } : null]);
            create_sub.push([CMENU_SEP]);
            create_sub.push([theUILang.fcNewDir, "flm.ui.getDialogs().showDialog('mkdir')"]);

            if (!utils.hasDir(entries)) {
                create_sub.push([CMENU_SEP]);
                create_sub.push([theUILang.flm_checksum_menu, () => dialogs.showDialog('checksum_create')]);
            }

            menu.push([CMENU_CHILD, theUILang.fcreate, create_sub]);
            menu.push([CMENU_SEP]);


            menu.push([theUILang.fCopy, "flm.ui.getDialogs().showDialog('copy')"]);
            menu.push([theUILang.fMove, "flm.ui.getDialogs().showDialog('move')"]);
            menu.push([theUILang.fDelete, "flm.ui.getDialogs().showDialog('delete')"]);
            menu.push([theUILang.fRename, (entries.length > 1) ? null : "flm.ui.getDialogs().showDialog('rename')"]);

            menu.push([CMENU_SEP]);

            flm.checksum.isChecksumFile(fext)
            && menu.push([theUILang.flm_checksum_menu_check, () => dialogs.showDialog('checksum_check')]);

            (!pathIsDir && thePlugins.isInstalled('mediainfo'))
            && menu.push([theUILang.fMediaI, function () {
                flm.actions.doMediainfo(target);
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
    this.open = function (path) {
        if (flm.utils.isDir(path)) {
            flm.goToPath(path);
        } else {
            flm.getFile(path);
        }

        return false;
    };

    // table
    this.setSorting = function () {
        const table = self.table();
        table.initialGetSortFunc = table.getSortFunc;
        table.getSortFunc = function (id, reverse, valMapping) {
            const sortResult = table.initialGetSortFunc(id, reverse, valMapping);
            return function (x, y) {

                //debugger;
                var xVal = x.split(self.tableEntryPrefix)[1];
                var yVal = y.split(self.tableEntryPrefix)[1];

                if (flm.ui.filenav.isTopDir(xVal) || flm.ui.filenav.isTopDir(yVal)) {
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

    this.getEntryHash = function (fileName) {
        return self.tableEntryPrefix + fileName;
    };

    this.setTableEntries = function (data) {

        var table = self.table();

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
                self.getEntryHash(path),
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

            var hash = self.getEntryHash(file.name);

            table.addRowById(entry, hash, flm.utils.getICO(file.name));

            if (!flm.ui.settings.getSettingValue('showhidden') && (file.name.charAt(0) === '.')) {
                table.hideRow(hash);
            }
        });
        table.refreshRows();

    };

    this.table = function () {
        return theWebUI.getTable("flm");
    };

    this.handleTableFormat = function (table, arr) {
        var i;
        for (i = 0; i < arr.length; i++) {
            if (arr[i] == null) {
                arr[i] = '';
            } else {
                switch (table.getIdByCol(i)) {
                    case 'name':
                        if (flm.ui.filenav.isTopDir(arr[i])) {
                            arr[i] = '../';
                        }
                        if (flm.utils.isDir(arr[i])) {
                            arr[i] = flm.utils.trimslashes(arr[i]);
                        }
                        // display proper spaces in filenames
                        //arr[i] = arr[i].replace(/ /g, '\u00a0')
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
                        if (flm.ui.settings.getSettingValue('permf') > 1) {
                            arr[i] = flm.utils.formatPermissions(arr[i]);
                        }
                        break;
                }
            }
        }
        return arr;
    };

    this.updateUiTable = function () {
        let table = self.table();


        table.renameColumnById('time', theUILang.fTime);
        table.renameColumnById('type', theUILang.fType);
        table.renameColumnById('perm', theUILang.fPerm);
    };

    return self;
}
