import {FileManagerUtils} from "./utils.js";
import {apiClient} from "./api.js";
import {FileManagerUi} from "./ui.js";
import {FileManagerActions} from "./actions.js";

(function () {

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
            options.config = flm.config;
            options.utils = flm.utils;
            options.settings = {
                'twig options': {
                    namespaces: self.namespaces,
                    name: filename,
                    //id: filename,
                    href: filename,
                    //allowInlineIncludes: true,
                    //debug: flm.getConfig().debug,
                    //trace: flm.getConfig().debug
                }
            };

            if ($type(options.async)) {
                options.settings['twig options'].allow_async = options.async;
            }
            Twig.cache(!flm.getConfig().debug);
            Twig.renderFile(undefined, options, function (error, template) {
                $type(error) && console.log("GOT ERROR: ", error, options);
                $type(fn) && fn(template);
            });
        };

        self.loadView = function (config, call) {
            const templatePath = flm.utils.isValidPath(config.template) ? config.template : '.' + flm.utils.buildPath([self.viewsPath, config.template]);
            flm.views.getView(templatePath, config.options, call, '.twig');
        }

        return self.setup();

    };

    function FileManager() {

        let self = this;
        self.getPlugin = function () {
            return thePlugins.get('filemanager');
        };

        let plugin = self.getPlugin();

        self.currentPath = null;
        self.showPathPromise = null;
        self.pluginUrl = plugin.path;
        self.EVENTS = plugin.ui.EVENTS;
        self.config = plugin.config;
        self.getConfig = function () {
            return self.getPlugin().config;
        }

        this.debug = (...args) => {
            flm.config.debug && console.debug(...args);
        }

        // expose api client
        self.client = function (endpoint) {
            return apiClient(endpoint);
        };

        self.getCurrentPath = function (file) {

            var path = self.currentPath + "";

            if ($type(file)) {
                file = file.length > 0 && self.utils.ltrim(file, '/') || '';
                path = self.utils.buildPath([path, file]);
            }

            return path;
        };

        self.goToPath = function (dir) {

            self.ui.disableNavigation();
            self.actions.inaction = true;

            return self.api.getDir(dir)
                .done((response) => {
                    self.actions.inaction = false;
                    self.ui.enableNavigation();

                    self.currentPath = self.utils.buildPath([dir]);
                    self.triggerEvent('changeDir', [self.currentPath]);
                    self.ui.filenav.setTableEntries(response.listing);
                    return response;
                }).fail((code, msg) => {
                    self.utils.logError(1, msg);
                    self.ui.enableNavigation();
                });

        };

        this.onEvent = (name, fn, oneTime = false) => {
            return $type(self.EVENTS[name])
                && (oneTime ? $(document).one(self.EVENTS[name], fn) : $(document).on(self.EVENTS[name], fn));
        }

        this.triggerEvent = (name, args) => {
            return $type(self.EVENTS[name]) && $(document).trigger(self.EVENTS[name], args) || console.log('No such event registered: ', name);
        }

        self.showPath = function (dir, highlight) {
            dir = self.stripJailPath(dir);
            highlight = highlight ?? null;
            highlight && self.onEvent('browserVisible', () => this.showInTable(highlight), true);

            return self.goToPath(dir).done(() => theTabs.show(self.getPlugin().ui.fsBrowserContainer));
        };

        this.showInTable = (file) => {
            const rowId = this.ui.filenav.getEntryHash(this.utils.basename(file));
            setTimeout(() => this.ui.filenav.table().selectRowById(rowId));
        }

        self.getFile = function (path) {
            $("#flm-get-data [name ='target']").val(path);
            $("#flm-get-data").submit();
        };

        self.getFullPaths = (entries) => {
            for (var i = 0; i < entries.length; i++) {
                entries[i] = self.getCurrentPath(self.stripJailPath(entries[i]));
            }

            return entries;
        }

        self.addJailPath = (paths) => {
            let entries = !Array.isArray(paths) ? [paths] : paths;

            let i;
            for (i = 0; i < entries.length; i++) {
                // ensure trailing slash on dirs
                entries[i] = self.utils.buildPath([self.config.homedir + "/", this.stripJailPath(entries[i])]);
            }

            return Array.isArray(paths) ? entries : entries[0];
        }

        self.stripJailPath = (entry) => {
            return self.utils.stripBasePath(entry, self.config.homedir);
        };

        self.Refresh = function (dir) {
            dir = dir || self.currentPath;
            let table = flm.ui.filenav.table()
            let scrollPos = table.scrollTop;

            return self.goToPath(dir)
                .done(() => scrollPos > table.TR_HEIGHT
                    && setTimeout(() => table.scrollTo(scrollPos))
                );
        };

        this.refreshIfCurrentPath = (path) => {
            // refresh in case we are in path
            if (!this.utils.isDir(path)) {
                // when destination is a directory name
                path = this.utils.basedir(path)
            }

            const same = (path === this.getCurrentPath());
            same && this.Refresh()
            return same;
        }

        self.init = () => {

            self.ui.init();

            // listening on events from ruTorrent components
            $(document).on('theTabs:onShow', (ev, id) => (id === plugin.ui.fsBrowserContainer) &&
                self.ui.filenav.onShow());
            $(document).on('theTabs:show', (ev, id) => {
                (id === plugin.ui.fsBrowserContainer)
                && self.ui.console.btn().show()
                || self.ui.filenav.onHide(id);
            });

            $(document).on('theWebUI:addAndShowSettings', (ev, data) => plugin.enabled && self.ui.settings.onShow(data));

            $(document).on('theWebUI:setSettings', (ev, data) => plugin.enabled && self.ui.settings.onSave(data));

            $(document).on('theWebUI:createFileMenu', (ev, data, e) => plugin.enabled && plugin.canChangeMenu() &&
                self.ui.handleFilesTabMenu(data, e));

            Promise.all([
                import("./file-archive.js"),
                import("./file-checksum.js")
            ]).then(([]) => {
                // notify plugin loaded
                plugin.ui.readyPromise.resolve(self.ui);
            });

        }

        this.utils = FileManagerUtils(self);
        this.api = apiClient(self.pluginUrl + 'action.php');
        this.views = new FileManagerViews(self);
        this.ui = new FileManagerUi(self);
        this.actions = new FileManagerActions();

        return this;
    }

    // namespace
    window.flm = theWebUI.FileManager = new FileManager();

})();
