// shut up
if (typeof plugin === undefined) {
    let plugin = new rPlugin();
}

dxSTable.prototype.selectRowById = function (rowId, scrollToRow = true, initial = true) {
    let row = $type(rowId) === 'object' ? rowId : $('#' + $.escapeSelector(rowId));
    let parent = $(this.dBody);
    let self = this;

    if (row.length) {
        flm.config.debug && console.debug('Row found', rowId, $(this.tBody).offset().top);
        setTimeout(() => self.selectRow(new CustomEvent("click"), row.get(0)), 1);

        if(scrollToRow) {
            //initial && parent.scrollTop(0);
            let pos = $(this.tBody).scrollTop() + row.position().top
            - $(this.tBody).height()/2 + row.height()/2

            // parent.animate({scrollTop:  pos < $(this.tBody).height()/2 ? row.position().top : pos}, 1);
            parent.scrollTop(pos < $(this.tBody).height()/2 ? row.position().top : pos);
        }

    } else {
        initial && parent.animate({scrollTop: 0}, 1);
        let pos = this.scrollTop + (TR_HEIGHT * 2);
        flm.config.debug && console.debug('Row NOT found', rowId, this.scrollTop, 'pos', pos, 'tbody', $(this.dBody).height());

        parent.animate({scrollTop: pos}, 1, () => {});
        if (pos < $(this.dBody).height()) {
            self.selectRowById(rowId, true, false);
        }

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
        entryMenu: "flm.onSetEntryMenu",
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

