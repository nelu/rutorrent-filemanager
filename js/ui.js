import {FileManagerDialogs} from "./ui-dialogs.js";
import {FsBrowser} from "./ui-fs.js";

export function FileManagerUi(flm) {

    let self = this;

    // table filesystem navigation
    this.filenav = new FsBrowser(flm);

    //  operation dialogs
    this.dialogs = new FileManagerDialogs(this.filenav);

    this.settings = {
        defaults: {
            "showhidden": true,
            "histpath": 5,
            "timef": '%d-%M-%y %h:%m:%s',
            "permf": 1,
            "logActions": false,
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
                flm.views.loadView({
                        template: 'settings-pane',
                        options: {'opts': this.getSettings()}
                    },
                    function (view) {
                        flm.getPlugin().attachPageToOptions($(view).get(0), theUILang.fManager);
                        flm.triggerEvent('settingsShow', [view]);

                    }
                );
            } else {
                flm.triggerEvent('settingsShow');
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

    this.console = {

        loader: thePlugins.isInstalled('create')
            ? 'create'
            : 'default',
        loaded: null,
        dialog: function () {
            return $(self.dialogs.getDialogId('console'));
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
            var config = self.dialogs.getDialogConfig('console');
            var diagId = self.dialogs.getDialogId('console');
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
                    self.dialogs.getDialogHeader(diagId)
                        .prepend('<span class="flm-sprite-diag flm-sprite sprite-console"></span>');

                    $('#flm-diag-console-clear').click(function () {
                        self.console.clearlog();
                    });

                    theDialogManager.setHandler(diagId, 'beforeShow', function () {
                        $('#flm-diag-stop').click(function () {
                            self.console.logMsg(theUILang.fStops[theWebUI.FileManager.activediag] + "\n");
                            //theWebUI.FileManager.logStop();

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

        init: function () {
            let self = this;
            $('#tabbar').append('<input type="button" id="fMan_showconsole" class="Button" value="Console" style="display: none;">');
            this.btn().click(() => self.show());
        },

        btn: () => {
            return $('#fMan_showconsole');
        },

        clearlog: function () {
            return $('#flm_popup_console-log-container pre').empty();
        },

        show: function (msg, viewEvents) {
            var diagId = self.dialogs.getDialogId('console');

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

    };

    this.getDialogs = function () {
        return self.dialogs;
    };

    this.createDataFrame = () => {
        $(document.body).append($("<iframe name='datafrm'/>")
            .css({
                visibility: "hidden"
            }).attr({
                name: "datafrm", id: "datafrm"
            }).width(0).height(0)
            .on('load', function () {
                var d = (this.contentDocument || this.contentWindow.document);
                if (d.location.href !== "about:blank") try {
                    eval(d.body.innerHTML);
                } catch (e) {
                }
            }));
    };

    this.addContextMenu = (menu, entry, after, before) => {
        let reference = after || before;
        let createPos = menu.length - 1;

        if (reference) {
            createPos = this.getContextMenuEntryPosition(menu, reference);
            if (createPos >= 0) {
                after && menu.splice(++createPos, 0, entry) || menu.splice(--createPos, 0, entry);
            }
        } else {
            menu.push(entry);
        }

        // entry's position in the array
        return createPos;
    };

    this.getContextMenuEntryPosition = function (menu, what, atIndex) {
        atIndex = atIndex || 0;
        var pos = -1;
        $.each(menu, function (i, value) {

            if (value[atIndex] === what) {
                pos = i;
                return false;
            }
        });

        return pos;
    };

    this.getFilesTabMenu = (currentTorrentDirPath, selectedName, selectedPath, selectedEntries) => {

        self.filenav.setSelectedTarget(selectedPath);
        self.filenav.selectedEntries = selectedEntries;
        let fileManagerSubmenu = [];

        fileManagerSubmenu = self.filenav.getEntryMenu(selectedName, selectedEntries);

        flm.triggerEvent('entryMenu',  [fileManagerSubmenu, selectedName]);

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
            flm.showPath(currentTorrentDirPath, flm.utils.basename(selectedName));
        }]);

        return fileManagerSubmenu;
    }

    this.handleFilesTabMenu = function (selected, event) {
        let plugin = flm.getPlugin();

        plugin.fno = null;
        plugin.mode = null;

        let selectedTorrent = theWebUI.dID && $type(theWebUI.torrents[theWebUI.dID]) ? theWebUI.torrents[theWebUI.dID] : null;

        if (!selectedTorrent) {
            console.error('No torrent files');
            return false;
        }

        const torrentPath = selectedTorrent.multi_file ? selectedTorrent.base_path : selectedTorrent.save_path;
        let getEntry = (item) => {
            let r;
            let itemPath;
            if (item.split('_d_').length > 1) {
                r = theWebUI.dirs[theWebUI.dID].getEntry(item);
                // topdircheck
                if (r === null) {
                    return false;
                }
                itemPath = flm.utils.buildPath([theWebUI.dirs[theWebUI.dID].current, r.name + '/']);
            } else {
                r = theWebUI.files[theWebUI.dID][iv(item.split('_f_')[1])];
                itemPath = r.name;
            }

            return {
                name: flm.utils.basename(itemPath),
                path: flm.stripJailPath(flm.utils.buildPath([torrentPath, itemPath])),
                size: r.size,
                complete: iv(r.percent) === 100
            };
        }

        // another way of getting the selected row id
        // since not available in the call stack
        const selectedId = event.originalEvent.srcElement.parentNode.parentElement.id;

        // get entry in local format
        selected = getEntry(selectedId);

        let table = theWebUI.getTable("fls");
        let validEntries = [];

        $.each(table.getSelected(), (i, row) => {
            let entry = getEntry(row);
            entry && entry.complete && validEntries.push(entry.path);
        });

        if (validEntries.length) {

            let selectedPath = validEntries[0];
            if (selected && selected.complete) {
                selectedPath = selected.path;
            }

            var el = theContextMenu.get(theUILang.Priority);
            if (el) {
                theContextMenu.add(el,
                    [CMENU_CHILD, theUILang.fManager,
                        self.getFilesTabMenu(
                            flm.utils.basedir(selectedPath),
                            selectedPath,
                            selectedPath,
                            validEntries
                        )
                    ]
                );
            }
            flm.triggerEvent('torrentFileEntryMenu', [theContextMenu, selected, selectedPath, validEntries, table]);
        } else {
            flm.debug('No valid files selected');
        }

    };

    this.init = function () {
        // console
        self.console.init();
        // file navigation
        self.filenav.init();
    };

    this.disableNavigation = function () {
        self.filenav.disableTable();
        self.filenav.disableRefresh();
    };

    this.enableNavigation = function () {
        self.filenav.enableTable();
        self.filenav.enableRefresh();

    };

    this.formatDate = function (timestamp) {
        return flm.utils.formatDate(timestamp, this.settings.timef || '%d.%M.%y %h:%m:%s')
    };


    this.viewNFO = function (file) {
        file && self.filenav.setSelectedTarget(file);
        self.dialogs.showDialog('nfo_view');
    };

    this.showPermissions = function () {
        self.dialogs.showDialog('permissions');
    };

    return this;
}