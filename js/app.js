import {FileManagerUtils} from "./utils.js";
import {apiClient} from "./api.js";
import {userInterface} from "./ui.js";

(function (global) {

    const FileManagerViews = function (viewPath) {

        var self = {};
        self.viewsPath = viewPath;
        self.namespaces = {'flm': self.viewsPath + '/'};

        const utils = FileManagerUtils(window.flm);

        for (let funcName in utils) {
            if ($type(utils[funcName]) === "function") {
                Twig.extendFunction(funcName, utils[funcName]);
            }
        }

        self.getView = function (name, options, fn) {

            options = options || {};
            var filename = name + '.twig';

            options.views = options.views || 'flm';
            options.theUILang = theUILang;
            options.utils = flm.utils;
            options.settings = {
                'twig options': {
                    namespaces: self.namespaces,
                    name: filename,
                    href: filename
                }
            };

            if ($type(options.async)) {
                options.settings['twig options'].allow_async = options.async;
            }

            return Twig.renderFile(undefined, options, function (dumb, template) {
                $type(fn) && fn(template);
            });
        };

        return self;

    };

    const manager = function() {
        let self =  {
            inaction: false,

            cleanactions: function () {

                $(".fMan_Stop").attr('disabled', true);
                clearTimeout(theWebUI.FileManager.actiontimeout);
                flm.ui.console.hideProgress();
                theWebUI.FileManager.activediag = '';
                theWebUI.FileManager.actionlist = {};
                theWebUI.FileManager.actionstats = 0;
                theWebUI.FileManager.actiontoken = 0;
                theWebUI.FileManager.actiontimeout = 0;
                theWebUI.FileManager.actionlp = 0;

            },

            stripJailPath: function (entry) {
                const path = flm.utils.stripBasePath(entry, flm.config.homedir) ;
                return flm.utils.isDir(entry) ? path + '/' : path;
            },

            addJailPath: function (entries) {
                let i;
                for (i = 0; i < entries.length; i++) {
                    entries[i] = flm.utils.buildPath([flm.config.homedir, this.stripJailPath(entries[i])]);
                }

                return entries;
            },

            getFullPaths: function (entries) {

                for (var i = 0; i < entries.length; i++) {
                    entries[i] = flm.getCurrentPath(this.stripJailPath(entries[i]));
                }

                return entries;
            },

            logStop: function () {

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
            },

            logAction: function (action, text) {
                flm.ui.console.show(action + ': ' + text);
            },

            logConsole: function (action, text) {
                flm.ui.console.logMsg(action + ': ' + text);
            },

            doMediainfo: function (target) {

                theWebUI.startConsoleTask("mediainfo", flm.getPlugin().name, {
                    'action': 'fileMediaInfo',
                    'target': target
                }, {noclose: true});

            }
        }

        self.createTorrent = function (target) {
            var relative = self.stripJailPath(target);
            var isRelative = (relative !== target);

            var path = self.addJailPath([isRelative ? relative : target])[0];

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
            flm.manager.inaction = true;

            return flm.api.getDir(dir)
                .then(function (response) {
                        flm.manager.inaction = false;
                        flm.ui.enableNavigation();

                        flm.currentPath = flm.utils.buildPath([dir]);
                        $(document).trigger(flm.EVENTS.changeDir, [flm.currentPath]);
                        flm.ui.browser.setTableEntries(response.listing);
                    },
                    function (code, msg) {
                        flm.utils.logError(1, msg);
                        flm.ui.enableNavigation();
                    });

        };

        flm.showPath = function (dir, highlight) {

            dir = flm.manager.stripJailPath(dir);
            highlight = highlight || null;

            return flm.goToPath(dir).then(function (value) {

                if (highlight) {
                    flm.showPathPromise = $.Deferred();

                    flm.showPathPromise.promise().then(
                        function () {
                            $(document.getElementById(flm.ui.browser.getEntryHash(highlight)))
                                .trigger("mousedown");
                        }
                    );

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

        flm.Refresh = function (dir) {
            dir = dir || flm.currentPath;
            return flm.goToPath(dir);
        };


        // events binding
        $(document).on(flm.EVENTS.browserVisible, function () {

            if (flm.showPathPromise) {
                flm.showPathPromise.resolve();
                flm.showPathPromise = null;
            }
        });

        flm.utils = FileManagerUtils(flm);
        flm.api = apiClient(flm.pluginUrl + 'action.php');
        flm.views = FileManagerViews(flm.pluginUrl + 'views');
        flm.ui = userInterface(flm);
        flm.manager = manager();

        return flm;
    }

// namespace

    theWebUI.FileManager = new FileManager();
    global.flm = theWebUI.FileManager;

})
(window);
