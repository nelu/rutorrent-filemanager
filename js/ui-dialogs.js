class FlmRdb extends theWebUI.rDirBrowser {

    xhr = null;
    hide(notify = true) {
        notify && this.edit.change();
        return super.hide();
    }

    unload() {
        //kill the request
        //this.xhr && this.xhr.abort()

        this.edit.remove();
        this.btn.remove();
        this.frame.remove();
    }
}
export function FileManagerDialogs(browser) {

    let self = this;

    self.forms = {
        archive: {
            modal: true,
            pathbrowse: true,
            template: "dialog-archive"
        }, copy: {
            modal: true,
            pathbrowse: true,
            template: "dialog-copy"
        }, console: {
            template: "dialog-console",
            persist: true
        }, mkdir: {
            modal: false,
            template: 'dialog-new-dir'
        }, move: {
            modal: true,
            pathbrowse: true,
            template: "dialog-move"
        }, delete: {
            modal: true,
            pathbrowse: false,
            template: "dialog-delete"
        }, extract: {
            modal: true,
            pathbrowse: true,
            template: "dialog-extract"
        }, permissions: {
            modal: false,
            template: "dialog-permissions"
        }, rename: {
            modal: true,
            template: "dialog-rename"
        }, checksum_check: {
            modal: true,
            template: "dialog-checksum_check"
        }, checksum_create: {
            modal: true,
            pathbrowse: true,
            multiselectFilesOnly: true,
            template: "dialog-checksum_create"
        }, nfo_view: {
            modal: false,
            template: "dialog-nfo_view"
        }
    };
    self.activeDialogs = {};
    self.currentDialog = "window";
    self.onStartEvent = null;
    self.startedPromise = null;
    self.dirBrowser = {}; // multiple file operations are ui blocking

    self.bindKeys =  (diagId) => {
        $("#"+diagId).keydown(function (e) {
             (e.keyCode === 13) && self.startButton(diagId).click();
        });
    };

    self.setDialogConfig = (diagId, config) => {
        self.forms[diagId] = config;

        return self;
    }

    self.getDialogConfig = (diagId) => {
        if (!self.forms.hasOwnProperty(diagId)) {
            console.error('No such dialog configured: ', diagId);
            return false;
        }

        let config = self.forms[diagId];
        config.modal = $type(config.modal) ? config.modal : true;

        // modal dialogs use the same window for user blocking of input
        config.diagWindow = self.getDialogsPrefix(!config.modal ? diagId : 'window');

        return config;
    }

    self.afterShow = (diagId) => {
        setTimeout(function () {
            $("#"+diagId).select().focus();
        });
    }
    // common dialog cleanup
    self.afterHide = function (dialogId, what) {

        let diagConf = self.getDialogConfig(what);
        const persistentDiag = ($type(diagConf.persist) && diagConf.persist);

        if (self.dirBrowser.hasOwnProperty(dialogId)) {
            for (let i = 0; i < self.dirBrowser[dialogId].length; i++) {
                $type(self.dirBrowser[dialogId][i]) && $type(self.dirBrowser[dialogId][i]) && self.dirBrowser[dialogId][i].hide(false);
                if (!persistentDiag) {
                    // use setTimeout for dom elements to be removed after this afterHide call
                    // for scripts running inside the dialog views
                    !persistentDiag && setTimeout(() => self.deleteDirBrowser(dialogId, i));
                }
            }
        }

        // use setTimeout for modal background needs to be removed first
        !persistentDiag && setTimeout(() => self.deleteDialog(dialogId, what));
    }

    // common before event handle
    self.beforeShow = function (diagId, what) {
        diagId = '#' + diagId;
        var newContent = $(diagId);

        self.enableStartButton(diagId).on('click', function () {
            flm.getConfig().debug && console.log("Start button click " + diagId);

            if ($type(self.onStartEvent) === "function") {
                self.disableStartButton(diagId);
                self.hide(diagId);

                self.startedPromise = self.onStartEvent.apply(self, arguments);
                self.startedPromise.then(function () {
                    //self.hide(diagId);
                }, function (data) {
                    flm.utils.logError(data.errcode ? data.errcode : "", data.msg || data);
                });
            }
        });

        setTimeout(function () {
            self.startButton(diagId).select().focus();
        });
    }

    self.startButton = function (diag) {
        diag = flm.utils.ltrim(diag, '#');
        return $(`#${diag} .flm-diag-start`);
    }

    self.disableStartButton = function (diag) {
        return self.startButton(diag).attr('disabled', true);
    }

    self.enableStartButton = function (diag) {
        return self.startButton(diag).attr('disabled', false);
    }

    self.getCheckedList = function (diag) {

        var list = [];

        let checks = $("#" + diag + ' .checklist input:checked');
        checks.each(function (index, val) {
            //list.push(flm.utils.addslashes(decodeURIComponent(val.value)));
            list.push(decodeURIComponent(val.value));
        });

        return list;
    }

    self.getCurrentDialog = () => {
        return self.currentDialog;
    }

    self.getDialogId = function (formId) {
        formId = formId || 'window';
        return '#' + self.getDialogsPrefix(flm.utils.ltrim(formId, '#'));
    }

    self.getDialogsPrefix = function (formId) {
        return 'flm_popup_' + formId;
    }

    self.getDialogHeader = function (diagId) {
        return $(`#${diagId}-header`);
    }

    self.getTargetPath = function (container) {
        var ele = self.dirBrowserInput(container)
        return ele[0].tagName.toLowerCase() === 'input' ? ele.val() : ele.text();
    }

    self.hide = function (dialogId, afterHide) {
        dialogId = flm.utils.ltrim(dialogId, '#');
        theDialogManager.hide(dialogId, afterHide);
    }

    self.onStart = function (callback) {
        self.startedPromise = null;
        self.onStartEvent = callback;
    }

    self.show = function (dialogId, afterShow) {
        dialogId = dialogId || 'window';
        theDialogManager.show(flm.utils.ltrim(dialogId, '#'), afterShow);
    }

    self.updateTargetPath = function (container, path) {
        var ele = self.dirBrowserInput(container);
        path = flm.addJailPath(path);
        return ele[0].tagName.toLowerCase() === 'input' ? ele.val(path) : ele.text(path);
    }

    self.dirBrowserInput = function (diagId) {
        diagId = '#' + flm.utils.ltrim(diagId, '#');
        return $(diagId + '.dlg-window .flm-diag-nav-path');
    }

    self.setDirBrowser = function (diagId, withFiles) {
        diagId = flm.utils.ltrim(diagId, '#');
        let inputSelectors = $('#' + diagId + ' .flm-diag-nav-path');

        if (thePlugins.isInstalled("_getdir")) {
            if (!self.dirBrowser.hasOwnProperty(diagId)) {
                self.dirBrowser[diagId] = []
            }
            for (var i = 0; i < inputSelectors.length; i++) {
                let rdb = new FlmRdb(inputSelectors[i].id, withFiles);
                self.dirBrowser[diagId][i] = rdb;
                rdb.btn.addClass(['m-0', 'p-1']);

            }
        }
    }

    self.createDialog = (diagId, content, config, viewEvents, what) => {

        viewEvents = viewEvents || {};

        // create it
        // if (!theDialogManager.items.hasOwnProperty(diagId)) {
        theDialogManager.make(diagId, theUILang['flm_popup_' + what], content, config.modal); // prevent the user from changing table selection by default
        $type(config.pathbrowse) && config.pathbrowse && self.setDirBrowser(diagId, config.pathbrowseFiles);

        self.getDialogHeader(diagId)
            .prepend('<icon class="flm-sprite-diag flm-sprite sprite-' + what + '"></icon>');

        self.bindKeys(diagId);

        // $("#"+diagId).find('.flm-diag-cancel')
        //     .click(function () {
        //         console.log("cancel triggered");
        //         dialogs.hide(diagId);
        //     });
        //}

        const eventNames = ['beforeHide', 'beforeShow', 'afterHide', 'afterShow'];

        for (let i = 0; i < eventNames.length; i++) {
            const evName = eventNames[i];
            theDialogManager.setHandler(diagId, evName, function (id) {
                $type(self[evName]) && self[evName].apply(self, [id, what]);
                viewEvents.hasOwnProperty(evName) && viewEvents[evName].apply(self, [id, what]);
            });
        }

    }

    self.deleteDialog = (dialogId) => {
        console.log("deleteDialog: ", dialogId);
        $("#" + dialogId).remove();
        delete theDialogManager.items[dialogId];
    }

    self.deleteDirBrowser = (id, i) => {
        // cleanup dom
        $type(self.dirBrowser[id][i]) && self.dirBrowser[id][i].unload();
        delete self.dirBrowser[id][i];
    }

    self.dialogExists = (id) => {
        return $type(theDialogManager.items[id]) ? theDialogManager.items[id] : false;
    }

    self.hideDialog = (diagId, afterHide) => {
        let config = self.getDialogConfig(diagId);
        config && self.hide(config.diagWindow, afterHide);
    }

    self.showDialog = function (what, viewEvents) {

        let config = self.getDialogConfig(what);

        if (!config) {
            return;
        }

        //let browser = flm.ui.browser;
        // modal dialogs use the same window for user blocking of input
        const diagWindow = config.diagWindow;
        self.currentDialog = diagWindow;

        if (!self.dialogExists(diagWindow)) {
            let templateVars = $type(config.options) ? config.options : {};
            templateVars.apiUrl = flm.api.endpoint;
            templateVars.selectedEntries = browser.selectedEntries;
//                options.selectedTarget = !browser.selectedTarget ? '/'  :flm.getCurrentPath(browser.selectedTarget);

            templateVars.selectedTarget = !browser.getSelectedTarget() ? '/' : browser.getSelectedTarget();
            templateVars.currentPath = flm.addJailPath(flm.getCurrentPath('/'));

            config.options = templateVars;

            flm.views.loadView(config, (html) => {
                self.createDialog(diagWindow, html, config, viewEvents, what);
                theDialogManager.show(diagWindow);
            });
        } else {
            theDialogManager.show(diagWindow);
        }

    }

    return self;
}