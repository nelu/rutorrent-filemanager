import {FileManagerDialogs} from "./ui-dialogs.js";
import {FsBrowser} from "./ui-fs.js";

export function FileManagerUi(flm) {

    let self = this;

    // table filesystem navigation
    self.filenav = new FsBrowser();

    //  operation dialogs
    self.dialogs = new FileManagerDialogs(self.filenav);

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
                flm.views.loadView({
                        template: 'settings-pane',
                        options: {'opts': this.getSettings()}
                    },
                    function (view) {
                        flm.getPlugin().attachPageToOptions($(view).get(0), theUILang.fManager);
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

    self.console = {

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

    self.getDialogs = function () {
        return self.dialogs;
    };

    self.createDataFrame = () => {
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

    self.getFilesTabMenu = (currentTorrentDirPath, selectedName, selectedPath, selectedEntries) => {

        self.filenav.selectedTarget = selectedPath;
        self.filenav.selectedEntries = selectedEntries;
        let fileManagerSubmenu = [];


        fileManagerSubmenu = self.filenav.getEntryMenu(selectedName, selectedEntries);

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

    self.handleFilesTabMenu = function (selected) {
        let plugin = flm.getPlugin();

        plugin.fno = null;
        plugin.mode = null;
        var table = theWebUI.getTable("fls");


        var fid = table.getFirstSelected();
        var selectIsDir = theWebUI.dirs[theWebUI.dID].isDirectory(fid);

        var selectedName = selected ? selectIsDir ? selected.name += '/' : selected.name : '/';

        var selectedTorrent = theWebUI.dID && $type(theWebUI.torrents[theWebUI.dID]) ? theWebUI.torrents[theWebUI.dID] : null;

        var torrentPath = selectedTorrent.multi_file ? selectedTorrent.base_path : selectedTorrent.save_path;
        var currentTorrentDirPath = flm.stripJailPath(flm.utils.buildPath([torrentPath, theWebUI.dirs[theWebUI.dID].current]));

        var selectedPath = flm.utils.buildPath([currentTorrentDirPath, selectedName]);

        selectedPath = flm.stripJailPath(selectedPath);


        var selectedEntries = [];
        var rows = table.rowSel;

        var entry;
        var entryPath;
        for (var i in rows) {
            if (rows[i]) {
                entry = theWebUI.dirs[theWebUI.dID].getEntry(i);
                if (entry) {
                    entryPath = flm.utils.buildPath([torrentPath, entry.name]);
                    entryPath = flm.stripJailPath(entryPath);
                    if (theWebUI.dirs[theWebUI.dID].isDirectory(i)) {
                        entryPath += '/';
                    }

                    selectedEntries.push(entryPath);
                }
            }
        }
        const fileManagerSubmenu = selected ? self.getFilesTabMenu(currentTorrentDirPath, selectedName, selectedPath, selectedEntries) : [];

        var el = theContextMenu.get(theUILang.Priority);
        if (el) {
            theContextMenu.add(el, [CMENU_CHILD, theUILang.fManager, fileManagerSubmenu]);
        }

        $(document).trigger(flm.EVENTS.torrentFileEntryMenu, [theContextMenu, selected, selectedPath, selectedEntries, table]);
    };

    self.init = function () {

        // file navigation
        self.initFileBrowser();
    };

    self.disableNavigation = function () {
        self.filenav.disableTable();
        self.filenav.disableRefresh();
    };

    self.enableNavigation = function () {
        self.filenav.enableTable();
        self.filenav.enableRefresh();

    };

    self.formatDate = function (timestamp) {
        return flm.utils.formatDate(timestamp, this.settings.timef || '%d.%M.%y %h:%m:%s')
    };

    self.initFileBrowser = function () {
        $('#tabbar').append('<input type="button" id="fMan_showconsole" class="Button" value="Console" style="display: none;">');
        $('#fMan_showconsole').click(function () {
            self.console.show();
        });
        // file navigation
        self.filenav.init();
    };

    self.onSettingsShow = function (call) {
        $(document).on("flm.settingsOnShow", function (view) {
            call(view);
        });

    };

    self.showArchive = function () {
        return self.dialogs.showDialog('archive');
    };

    self.viewNFO = function (file) {
        file && (self.filenav.selectedTarget = file);
        self.dialogs.showDialog('nfo_view');
    };

    self.showPermissions = function () {
        self.dialogs.showDialog('permissions');

    };

    self.showSFVcreate = function () {
        self.dialogs.showDialog('sfv_create', {
            afterShow: function () {
            }
        });
    };

    return self;

}