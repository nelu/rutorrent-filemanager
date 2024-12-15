import {FileManagerUtils} from "./utils.js";
import {apiClient} from "./api.js";
import {FileManagerUi} from "./ui.js";
import {FileManagerActions} from "./actions.js";
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

        let flm = this;
        flm.getPlugin = function () {
            return thePlugins.get('filemanager');
        };

        let plugin = flm.getPlugin();

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
                    flm.ui.filenav.setTableEntries(response.listing);
                }, function (code, msg) {
                    flm.utils.logError(1, msg);
                    flm.ui.enableNavigation();
                });

        };


        flm.showPath = function (dir, highlight) {

            dir = flm.stripJailPath(dir);
            highlight = highlight || null;

            return flm.goToPath(dir).then(function (value) {

                if (highlight) {
                    flm.showPathPromise = $.Deferred();

                    flm.showPathPromise.promise().then(function () {
                        $(document.getElementById(flm.ui.filenav.getEntryHash(highlight)))
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
                flm.ui.filenav.onShow());
            $(document).on('theTabs:show', (ev, id) => {
                (id !== plugin.ui.fsBrowserContainer)
                && flm.ui.filenav.onHide(id)
                || $('#fMan_showconsole').css('display', 'inline');
            });

            $(document).on('theWebUI:addAndShowSettings', (ev, data) => plugin.enabled && flm.ui.settings.onShow(data));

            $(document).on('theWebUI:setSettings', (ev, data) => plugin.enabled && flm.ui.settings.onSave(data));

            $(document).on('theWebUI:createFileMenu', (ev, data, e) => plugin.enabled && plugin.canChangeMenu() &&
                flm.ui.handleFilesTabMenu(data, e));

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
        flm.actions  = new FileManagerActions();

        return this;
    }

    // namespace
    global.flm = theWebUI.FileManager = new FileManager();

})(window);
