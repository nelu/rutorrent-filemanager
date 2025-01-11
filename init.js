// shut up
if (typeof plugin === undefined) {
    let plugin = new rPlugin();
}

dxSTable.prototype.selectRowById = function (rowId, scrollToRow = true, initial = true, offsetTop = 0) {
    let row = $type(rowId) === 'object' ? rowId : $('#' + $.escapeSelector(rowId));
    let parent = $(this.dBody);
    let self = this;

    if (row.length) {
        flm.debug('Row found', rowId, row.position().top , offsetTop);
        parent.stop(true, true);

        scrollToRow && parent.scrollTop(row.position().top + offsetTop);

        setTimeout(function () {
            parent.stop(true, true);
            self.selectRow(new CustomEvent("click"), row.get(0));
        }, 1);
    } else {
        initial && parent.stop(true, true).scrollTop(0);

        let pos = parent.scrollTop() + parent.height();
        flm.debug('Row NOT found', rowId,
            'parent.scrollTop()', parent.scrollTop(),
            'parent.height', parent.height(),
            'parent[0].scrollHeight', parent[0].scrollHeight,
            'parent.outerHeight()', parent.outerHeight(),
        );

        parent.scrollTop(pos);
        // look again
        parent.outerHeight() < parent[0].scrollHeight - parent.scrollTop()
            && setTimeout(() => self.selectRowById(rowId, true, false, pos));
    }

}

plugin.ui = {
    fsBrowserContainer: "flm-browser",
    readyPromise: $.Deferred(),
    EVENTS: {
        taskDone: 'flm.taskDone',
        delete: 'flm.filesDelete',
        move: 'flm.filesDelete',
        settingsShow: "flm.settingsOnShow",
        entryMenu: "flm.onContextMenu",
        browserVisible: "flm.onBrowserVisible",
        rename: 'flm.filesDelete',
        torrentFileEntryMenu: 'torrentFileEntryMenu',
        changeDir: 'flm.onChangeCurrentDir'
    }
};

plugin.ui.fsBrowserTableContainer = plugin.ui.fsBrowserContainer + "-table";


plugin.loaded = () => {
    return plugin.ui.readyPromise;
};
// boostrap ui elements, at a early stage in rutorrent ui load
plugin.ui.setConfig = function () {

    plugin.attachPageToTabs(
        $('<div>')
            .attr("id", plugin.ui.fsBrowserContainer)
            .addClass('table_tab stable')
            .html('<div id="' + plugin.ui.fsBrowserTableContainer + '" class="stable"></div>')
            .get(0),
        "filemanager", "lcont");

    theWebUI.tables.flm = {
        obj: new dxSTable(),
        format: (table, arr) => flm.ui.filenav.handleTableFormat(table, arr),
        ondblclick: (id) => flm.ui.filenav.handleOpenEntry(id),
        onselect: (e, id) => flm.ui.filenav.handleSelectEntry(e, id),
        ondelete: () => flm.ui.filenav.handleDeleteEntry(),
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

plugin.ui.getContextMenuEntryPosition = (menu, what, atIndex) => flm.ui.getContextMenuEntryPosition(menu, what, atIndex);

//  update/initialize rest ui elements, when localisation is loaded
plugin.ui.init = function () {

    plugin.resizeBottom = theWebUI.resizeBottom;
    theWebUI.resizeBottom = function (w, h) {
        plugin.resizeBottom.call(this, w, h);
        /*
                if (w !== null) {
                    w -= 16;
                }
                if (h !== null) {
                    h -= ($("#flm-navigation-head").outerHeight());
                    h -= ($("#tabbar").outerHeight());
                    h -= TR_HEIGHT + 2;
                }

                var table = flm.ui.filenav.table();
                if (table) {
                    table.resize(w, h);
                }*/
    };

    !thePlugins.isInstalled('data') && flm.ui.createDataFrame();

    if (plugin.canChangeTabs()) {
        plugin.renameTab(plugin.ui.fsBrowserContainer, theUILang.fManager);
        window.flm.init();
    }

    plugin.markLoaded();
};

// hooks
plugin.onRemove = function () {
    this.removePageFromTabs(plugin.ui.fsBrowserContainer);
    $('[id^="fMan_"]').remove();
};

plugin.onTaskFinished = function (task, onBackground) {
    flm.triggerEvent('taskDone', [task]);
};

// load language strings first + start app
plugin.onLangLoaded = () => {
    // ruTorrent component overrides
    plugin.flmOnShow = theTabs.onShow;
    theTabs.onShow = (id) => $(document).trigger('theTabs:onShow', [id]) && plugin.flmOnShow.call(theTabs, id);

    plugin.flmTabsShow = theTabs.show;
    theTabs.show = (id) => {
        $(document).trigger('theTabs:show', [id]);
        plugin.flmTabsShow.call(theTabs, id);
    };

    plugin.addAndShowSettings = theWebUI.addAndShowSettings;
    theWebUI.addAndShowSettings = (data) => $(document).trigger('theWebUI:addAndShowSettings', [data]) &&
        plugin.addAndShowSettings.call(theWebUI, data);

    plugin.flmSetSettings = theWebUI.setSettings;
    theWebUI.setSettings = (data) => $(document).trigger('theWebUI:setSettings', [data]) &&
        plugin.flmSetSettings.call(theWebUI, data);

    plugin.createTorrentFileMenu = theWebUI.createFileMenu;
    theWebUI.createFileMenu = (e, data) => (plugin.createTorrentFileMenu.call(theWebUI, e, data) &&
        $(document).trigger('theWebUI:createFileMenu', [data, e]));

    Promise.all([
        import('./' + plugin.path + 'js/twig.min.js'),
        import('./' + plugin.path + 'js/app.js')
    ]).then(([]) => {
        plugin.ui.init();
    });
}

if (plugin.enabled) {

    plugin.flmConfig = theWebUI.config;
    theWebUI.config = (data) => $(document).trigger('theWebUI:config', [data]) && plugin.flmConfig.call(theWebUI, data);
    $(document).on('theWebUI:config', () => plugin.canChangeTabs() && plugin.ui.setConfig());

    plugin.loadLang();
    plugin.loadCSS('css/main');
}

