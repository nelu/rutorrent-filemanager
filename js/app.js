import {FileManagerUtils} from "./utils.js";
import {apiClient} from "./api.js";
import {FileManagerUi} from "./ui.js";
// import {Twig} from "./twig.js";

(function (global) {

    const FileManagerViews = function (flm) {

        var self = this;
        self.viewsPath = flm.pluginUrl + 'views';
        self.namespaces = {'flm': self.viewsPath + '/'};

        self.setup = () => {
            const utils = flm.utils; //FileManagerUtils(flm);

            for (let funcName in utils) {
                if ($type(utils[funcName]) === "function") {
                    Twig.extendFunction(funcName, utils[funcName]);
                }
            }

            return self;
        }

        self.getView = function (name, options, fn, ext = '.twig') {

            options = options || {};
            var filename = name + ext;

            options.views = options.views || self.viewsPath;
            options.theUILang = theUILang;
            options.utils = flm.utils;
            options.settings = {
                'twig options': {
                    namespaces: self.namespaces,
                    name: filename,
                    //id: filename,
                    href: filename,
                    //allowInlineIncludes: true,
                    //debug: flm.getPlugin().debug,
                    //trace: flm.getPlugin().debug
                }
            };

            if ($type(options.async)) {
                options.settings['twig options'].allow_async = options.async;
            }
            Twig.cache(!flm.getPlugin().debug);
            Twig.renderFile(undefined, options, function (error, template) {
                $type(error) && console.log("GOT ERROR: ", error, options);
                $type(fn) && fn(template);
            });
        };

        self.loadView = function (config, call) {
            const templatePath = flm.utils.isValidPath(config.template) ? config.template : flm.utils.buildPath([self.viewsPath, config.template]);
            flm.views.getView(templatePath, config.options, call, '.twig.html');
        }

        return self.setup();

    };

    const FileManagerActions = function () {
        let self = this;

        self.inaction = false;
        self.notification = null;

        self.cleanactions = () => {

            $(".fMan_Stop").attr('disabled', true);
            clearTimeout(theWebUI.FileManager.actiontimeout);
            flm.ui.console.hideProgress();
            theWebUI.FileManager.activediag = '';
            theWebUI.FileManager.actionlist = {};
            theWebUI.FileManager.actionstats = 0;
            theWebUI.FileManager.actiontoken = 0;
            theWebUI.FileManager.actiontimeout = 0;
            theWebUI.FileManager.actionlp = 0;

        }

        self.doDelete = function (paths) {

            var deferred = $.Deferred();

            if (!$type(paths) || paths.length === 0) {
                deferred.reject({errcode: 'delete', msg: 'Empty paths'});
                return deferred.promise();
            }

            paths = flm.getFullPaths(paths);
            const cPath = flm.getCurrentPath();
            flm.actions.notify(theUILang.fStarts.delete + ": " + paths.length + " files");

            return flm.api.removeFiles(paths).then(function (result) {
                flm.actions.refreshIfCurrentPath(cPath);
                $(document).trigger(flm.EVENTS.delete, [paths]);
                return result;
            });
        };

        self.logStop = () => {

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
        }

        self.logAction = (action, text) => {
            flm.ui.console.show(action + ': ' + text);
        }

        self.logConsole = (action, text) => {
            flm.ui.console.logMsg(action + ': ' + text);
        }

        self.refreshIfCurrentPath = (path) => {
            // refresh in case we are in path
            if (!flm.utils.isDir(path)) {
                // when destination is a directory name
                path = flm.utils.basedir(path)
            }

            const same = (path === flm.getCurrentPath());
            same && flm.Refresh()
            return same;
        }

        self.notify = (contents, color = 'information', hideAfter= 5000) => {
            self.notification = $.noty(
                {
                    text: contents,
                    layout: 'bottomLeft',
                    type: color,
                    timeout: hideAfter,
                    closeOnSelfClick: true
                });

//            flm.actions.logConsole('rename', source + ' -> ' + destination);

        }

        self.doMediainfo = (target) => {
            theWebUI.startConsoleTask("mediainfo", flm.getPlugin().name, {
                'action': 'fileMediaInfo', 'target': target
            }, {noclose: true});

        }

        self.createTorrent = function (target) {
            var relative = self.stripJailPath(target);
            var isRelative = (relative !== target);

            var path = flm.addJailPath(isRelative ? relative : target);

            $('#path_edit').val(path);

            if ($('#tcreate').css('display') === 'none') {
                theWebUI.showCreate();
            }
        }

        return self;
    }

    function FileManager() {

        let flm = this
        flm.getPlugin = function () {
            return thePlugins.get('filemanager');
        };

        const plugin = flm.getPlugin();

        flm.currentPath = null;
        flm.showPathPromise = null;
        flm.pluginUrl = plugin.path;
        flm.EVENTS = plugin.ui.EVENTS;
        flm.config = plugin.config;
        flm.getConfig = function () {
            return flm.getPlugin().config;
        }

        // expose api client
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
            flm.actions.inaction = true;

            return flm.api.getDir(dir)
                .then(function (response) {
                    flm.actions.inaction = false;
                    flm.ui.enableNavigation();

                    flm.currentPath = flm.utils.buildPath([dir]);
                    $(document).trigger(flm.EVENTS.changeDir, [flm.currentPath]);
                    flm.ui.browser.setTableEntries(response.listing);
                }, function (code, msg) {
                    flm.utils.logError(1, msg);
                    flm.ui.enableNavigation();
                });

        };

        flm.handleFilesTabMenu = function (selected) {

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
            const fileManagerSubmenu = selected ? flm.ui.getFilesTabMenu(currentTorrentDirPath, selectedName, selectedPath, selectedEntries) : [];

            var el = theContextMenu.get(theUILang.Priority);
            if (el) {
                theContextMenu.add(el, [CMENU_CHILD, theUILang.fManager, fileManagerSubmenu]);
            }

            $(document).trigger(plugin.ui.EVENTS.torrentFileEntryMenu, [theContextMenu, selected, selectedPath, selectedEntries, table]);
        };

        flm.showPath = function (dir, highlight) {

            dir = flm.stripJailPath(dir);
            highlight = highlight || null;

            return flm.goToPath(dir).then(function (value) {

                if (highlight) {
                    flm.showPathPromise = $.Deferred();

                    flm.showPathPromise.promise().then(function () {
                        $(document.getElementById(flm.ui.browser.getEntryHash(highlight)))
                            .trigger("mousedown");
                    });

                }

                theTabs.show(flm.getPlugin().ui.fsBrowserContainer);

                return value;
            });

        };

        flm.getFile = function (path) {

            // $("#flm-get-data [name ='dir']").val(flm.currentPath);
            $("#flm-get-data [name ='target']").val(path);
            $("#flm-get-data").submit();

        };

        flm.getFullPaths = (entries) => {
            for (var i = 0; i < entries.length; i++) {
                entries[i] = flm.getCurrentPath(flm.stripJailPath(entries[i]));
            }

            return entries;
        }

        flm.addJailPath = (paths) => {
            let entries = !Array.isArray(paths) ? [paths] : paths;

            let i;
            for (i = 0; i < entries.length; i++) {
                // ensure trailing slash on dirs
                entries[i] = flm.utils.buildPath([flm.config.homedir+"/", this.stripJailPath(entries[i])]);
            }

            return Array.isArray(paths) ? entries : entries[0];
        }

        flm.stripJailPath = (entry) => {
            const path = flm.utils.stripBasePath(entry, flm.config.homedir);
            return flm.utils.isDir(entry) ? path + '/' : path;
        }

        flm.Refresh = function (dir) {
            dir = dir || flm.currentPath;
            return flm.goToPath(dir);
        };

        flm.init = () => {

            flm.ui.init();

            // listening on events from ruTorrent components
            $(document).on('theTabs:onShow', (ev, id) => (id === plugin.ui.fsBrowserContainer) &&
                flm.ui.browser.onShow());
            $(document).on('theTabs:show', (ev, id) => {
                (id !== plugin.ui.fsBrowserContainer)
                && flm.ui.browser.onHide(id)
                || $('#fMan_showconsole').css('display', 'inline');
            });

            $(document).on('theWebUI:addAndShowSettings', (ev, data) => plugin.enabled && flm.ui.settings.onShow(data));

            $(document).on('theWebUI:setSettings', (ev, data) => plugin.enabled && flm.ui.settings.onSave(data));

            $(document).on('theWebUI:createFileMenu', (ev, data) => plugin.enabled && plugin.canChangeMenu() &&
                flm.handleFilesTabMenu(data));

            $(document).on(flm.EVENTS.browserVisible, function () {

                if (flm.showPathPromise) {
                    flm.showPathPromise.resolve();
                    flm.showPathPromise = null;
                }
            });

            // notify plugin loaded
            plugin.ui.readyPromise.resolve(flm.ui);
        }

        flm.utils = FileManagerUtils(flm);
        flm.api = apiClient(flm.pluginUrl + 'action.php');
        flm.views = new FileManagerViews(flm);
        flm.ui = new FileManagerUi(flm);
        flm.actions = new FileManagerActions();

        return flm;
    }

// namespace
    let app = new FileManager();
    theWebUI.FileManager = app
    global.flm = app;

})(window);
