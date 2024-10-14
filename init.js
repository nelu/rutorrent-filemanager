plugin = plugin || {}; // shut up

plugin.ui = {
    fsBrowserContainer: "flm-browser",
    readyPromise: $.Deferred(),
    EVENTS: {
        taskDone: 'flm.taskDone',
        delete: 'flm.filesDelete',
        move: 'flm.filesDelete',
        settingsShow: "flm.settingsOnShow",
        entryMenu: "flm.onSetEntryMenu",
        browserVisible: "flm.onBrowserVisible",
        rename: 'flm.filesDelete',
        torrentFileEntryMenu: 'torrentFileEntryMenu',
        changeDir: 'flm.onChangeCurrentDir'
    }
};

plugin.ui.fsBrowserTableContainer = plugin.ui.fsBrowserContainer + "-table";

// boostrap ui elements, at a early stage in rutorrent ui load
plugin.ui.setConfig = function () {
    plugin.attachPageToTabs(
        $('<div>')
            .attr("id", plugin.ui.fsBrowserContainer)
            .addClass('table_tab stable')
            .html('<div id="' + plugin.ui.fsBrowserTableContainer + '" class="stable"></div>')
            .get(0),
        "filemanager", "lcont");

    theWebUI.tables.flm =  {
        obj: new dxSTable(),
        format: function (){return flm.ui.browser.uiTableFormat.apply(flm.ui.browser, arguments)},
        ondblclick: function () {
            flm.ui.browser.open(flm.ui.browser.selectedTarget);
            return false;
        },
        onselect: function () { flm.ui.browser.onSelectEntry.apply(flm.ui.browser, arguments);},
        ondelete: function () {
            flm.ui.browser.selectedEntries = flm.ui.browser.getSelection();
            flm.ui.getDialogs().showDialog('delete')
        },
        columns: [
            {
                text: theUILang.Name,
                width: "210px",
                id: "name",
                type: TYPE_STRING
            }, {
                text: theUILang.Size,
                width: "60px",
                id: "size",
                type: TYPE_NUMBER
            }, {
                text: '',
                width: "120px",
                id: "time",
                type: TYPE_STRING,
                "align": ALIGN_CENTER
            }, {
                text: '',
                width: "80px",
                id: "type",
                type: TYPE_STRING
            }, {
                text: '',
                width: "80px",
                id: "perm",
                type: TYPE_NUMBER
            }],
        container: plugin.ui.fsBrowserTableContainer
    };

};

plugin.ui.onTorrentFilesMenu = function (call) {
    $(document).on(plugin.ui.EVENTS.torrentFileEntryMenu, function (e, menu, table) {
        call(menu, table);
    });
};

plugin.ui.getContextMenuEntryPosition = function (menu, what, atIndex) {
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

// final stage:
plugin.ui.handleTorrentFilesMenu = function (e, selected) {

    plugin.fno = null;
    plugin.mode = null;
    var table = theWebUI.getTable("fls");


    var fid = table.getFirstSelected();
    var selectIsDir = theWebUI.dirs[theWebUI.dID].isDirectory(fid);

    var selectedName = selected
        ? selectIsDir ? selected.name += '/' : selected.name
        : '/';

    var selectedTorrent = theWebUI.dID && $type(theWebUI.torrents[theWebUI.dID])
        ? theWebUI.torrents[theWebUI.dID]
        : null;

    var torrentPath = selectedTorrent.multi_file ? selectedTorrent.base_path : selectedTorrent.save_path;
    var currentTorrentDirPath = flm.manager.stripJailPath(flm.utils.buildPath([torrentPath, theWebUI.dirs[theWebUI.dID].current]));

    var selectedPath = flm.utils.buildPath([currentTorrentDirPath, selectedName]);

    selectedPath = flm.manager.stripJailPath(selectedPath);


    var selectedEntries = [];
    var rows = table.rowSel;

    var entry;
    var entryPath;
    for (var i in rows) {
        if (rows[i]) {
            entry = theWebUI.dirs[theWebUI.dID].getEntry(i);
            if (entry) {
                entryPath = flm.utils.buildPath([torrentPath, entry.name]);
                entryPath = flm.manager.stripJailPath(entryPath);
                if (theWebUI.dirs[theWebUI.dID].isDirectory(i)) {
                    entryPath += '/';
                }

                selectedEntries.push(entryPath);
            }
        }
    }

    flm.ui.browser.selectedTarget = selectedPath;
    flm.ui.browser.selectedEntries = selectedEntries;
    var fileManagerSubmenu = [];
    if (selected) {

        fileManagerSubmenu = flm.ui.browser.getEntryMenu(selectedName, selectedEntries);

        $(document).trigger(plugin.ui.EVENTS.entryMenu, [fileManagerSubmenu, selectedPath]);

        var remove = [
            theUILang.fOpen,
            //theUILang.fCopy,
            theUILang.fMove,
            theUILang.fDelete,
            theUILang.fRename,
            theUILang.fcNewDir,

            theUILang.fMediaI,
            theUILang.fRefresh
        ];
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

    }

    fileManagerSubmenu.unshift([theUILang.fOpen, function () {
        flm.showPath(currentTorrentDirPath, selectedName);
    }
    ]);

    var el = theContextMenu.get(theUILang.Priority);
    if (el) {
        theContextMenu.add(el, [CMENU_CHILD, theUILang.fManager, fileManagerSubmenu]);
    }

    $(document).trigger(plugin.ui.EVENTS.torrentFileEntryMenu, [theContextMenu, selected, selectedPath, selectedEntries, table]);

};
//  update/initialize rest ui elements, when localisation is loaded
plugin.ui.init = function () {

    plugin.resizeBottom = theWebUI.resizeBottom;
    theWebUI.resizeBottom = function (w, h) {
        plugin.resizeBottom.call(this, w, h);

        if (w !== null) {
            w -= 16;
        }
        if (h !== null) {
            h -= ($("#fMan_navpath").outerHeight());
            h -= ($("#tabbar").outerHeight());
            h -= TR_HEIGHT + 2;
        }

        var table = flm.ui.browser.table();
        if (table) {
            table.resize(w, h);
        }
    };

    if (!thePlugins.isInstalled('data')) {

        $(document.body).append($("<iframe name='datafrm'/>").css({
            visibility: "hidden"
        }).attr({
            name: "datafrm",
            id: "datafrm"
        }).width(0).height(0).on('load', function () {
            var d = (this.contentDocument || this.contentWindow.document);
            if (d.location.href !== "about:blank")
                try {
                    eval(d.body.innerHTML);
                } catch (e) {
                }
        }));
    }

    if (plugin.canChangeTabs()) {
        plugin.renameTab(plugin.ui.fsBrowserContainer, theUILang.fManager);
        window.flm.ui.init();
    }

    plugin.addAndShowSettings = theWebUI.addAndShowSettings;
    theWebUI.addAndShowSettings = function (arg) {
        if (plugin.enabled) {
            window.flm.ui.settings.onShow(arg);
        }
        plugin.addAndShowSettings.call(theWebUI, arg);
    };

    plugin.flmSetSettings = theWebUI.setSettings;
    theWebUI.setSettings = function (arg) {

        if (plugin.enabled) {
            window.flm.ui.settings.onSave(arg);
        }
        plugin.flmSetSettings.call(this, arg);

    };

    if (plugin.canChangeMenu()) {
        plugin.createTorrentFileMenu = theWebUI.createFileMenu;
        theWebUI.createFileMenu = function (e, id) {
            if (plugin.createTorrentFileMenu.call(this, e, id)) {
                if (plugin.enabled) {
                    plugin.ui.handleTorrentFilesMenu(e, id);
                }
                return true;
            }
            return false;
        }
    }

    plugin.markLoaded();

};

// hooks
plugin.flmOnShow = theTabs.onShow;
theTabs.onShow = function (id) {

    if (id === plugin.ui.fsBrowserContainer) {
        window.flm.ui.browser.onShow();
    }
    plugin.flmOnShow.call(this, id);

};

plugin.flmTabsShow = theTabs.show;
theTabs.show = function (id) {

    if (id !== plugin.ui.fsBrowserContainer) {
        if (window.flm) {
            window.flm.ui.browser.onHide();
        }
    } else {
        $('#fMan_showconsole').css('display', 'inline');
    }
    plugin.flmTabsShow.call(this, id);

};

plugin.onRemove = function () {
    this.removePageFromTabs(plugin.ui.fsBrowserContainer);
    $('#fMan_showconsole').remove();
    $('[id^="fMan_"]').remove();
};

plugin.onLangLoaded = function () {
    return plugin.enabled && plugin.ui.init();
};

plugin.onTaskFinished = function (task, onBackground) {
    if (task.hasOwnProperty('errcode') && task.errors === 0) {
        // log to system
        //flm.utils.logSystem(task.errcode, " -> ", task.msg);
        //task.status = false;
        task.status = 1;
        task.errors = [($type(theUILang.fErrMsg[task.errcode])
            ? theUILang.fErrMsg[task.errcode] + " -> " + task.msg
            : task.msg)];
        delete task.errcode;
        // log the request error as task errors
        thePlugins.get("_task").check(task);

    } else if (!task.hasOwnProperty('errcode')) {
        $(document).trigger(plugin.ui.EVENTS.taskDone, task);
    }

};

// plugin init
// 1. early plugin setup of rutorrent components (UI mostly)
if (plugin.canChangeTabs()) {

    plugin.flmConfig = theWebUI.config;
    theWebUI.config = function (data) {
        plugin.ui.setConfig();
        // continue the init of the webUI
        plugin.flmConfig.call(this, data);

    };
}


// 2. delayed loading of the lib
// load view dependencies, first (hopefully)
injectScript(plugin.path + 'js/twig.min.js',
    // view engine
    function () {
        injectScript(plugin.path + 'js/app.js',
            function () {

                // localisation + app
                plugin.loadLang();
            });

    });
plugin.loadCSS('css/main');

