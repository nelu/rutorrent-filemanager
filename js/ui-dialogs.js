export function FileManagerDialogs(browser) {

    let self = this;

    self.forms = {
        archive: {
            modal: true, pathbrowse: true, template: "dialog-archive"
        }, copy: {
            modal: true, pathbrowse: true, template: "dialog-copy"
        }, console: {
            template: "dialog-console"
        }, mkdir: {
            modal: false, template: 'dialog-new-dir'
        }, move: {
            modal: true, pathbrowse: true, template: "dialog-move"
        }, delete: {
            modal: true, pathbrowse: false, template: "dialog-delete"
        }, extract: {
            modal: true, pathbrowse: true, template: "dialog-extract"
        }, permissions: {
            modal: false, template: "dialog-permissions"
        }, rename: {
            modal: true, template: "dialog-rename"
        }, sfv_check: {
            modal: true, template: "dialog-svf_check"
        }, sfv_create: {
            modal: true, pathbrowse: true, multiselectFilesOnly: true, template: "dialog-svf_create"
        }, nfo_view: {
            modal: false, template: "dialog-nfo_view"
        }
    };
    self.activeDialogs = {};
    self.currentDialog = "window";
    self.onStartEvent = null;
    self.startedPromise = null;
    self.dirBrowser = {}; // multiple file operations are ui blocking

    // common after event handle
    self.afterHide = function (dialogId, what) {

        if (self.dirBrowser.hasOwnProperty(dialogId)) {
            for (var i = 0; i < self.dirBrowser[dialogId].length; i++) {

                // closing the dialog, doesn't close the frame
                self.dirBrowser[dialogId][i].hide();
               // self.dirBrowser[dialogId][i].edit.remove();
            }

            self.dirBrowser[dialogId] = [];
        }

        // remove the whole dialog window
        setTimeout(() => {
            $("#" + dialogId).remove();
        })
    }
    // common before event handle
    self.beforeShow = function (diagId, what) {
        diagId = '#' + diagId;
        var newContent = $(diagId);

        self.enableStartButton(diagId).on('click', function () {
            flm.getPlugin().debug && console.log("Start button click "+diagId);

            if ($type(self.onStartEvent) === "function") {
                self.disableStartButton(diagId);
                self.hide(diagId);

                self.startedPromise = self.onStartEvent.apply(self, arguments);
                self.startedPromise.then(function () {
                    self.hide(diagId);
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
        return $(`${diag} .flm-diag-start`);
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
        dialogId = dialogId || 'window';
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
                self.dirBrowser[diagId][i] = new theWebUI.rDirBrowser(inputSelectors[i].id, withFiles);
            }
        }
    }

    self.createDialog = (diagId, content, config, viewEvents, what) => {

        viewEvents = viewEvents || {};

        // create it
        // if (!theDialogManager.items.hasOwnProperty(diagId)) {
        theDialogManager.make(diagId, theUILang['flm_popup_' + what], content, config.modal); // prevent the user from changing table selection by default
        $type(config.pathbrowse) && config.pathbrowse && self.setDirBrowser(diagId);

        self.getDialogHeader(diagId)
            .prepend('<span class="flm-sprite-diag flm-sprite sprite-' + what + '"></span>');

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

    self.showDialog = function (what, viewEvents) {

        if (!self.forms.hasOwnProperty(what)) {
            console.error('No such dialog configured: ', what);
            return;
        }

        let config = self.forms[what];
        //let browser = flm.ui.browser;

        config.modal = $type(config.modal) ? config.modal : true;

        // modal dialogs use the same window for user blocking of input
        var diagId = self.getDialogsPrefix(!config.modal ? what : 'window');

        let templateVars = $type(config.options) ? config.options : {};
        templateVars.apiUrl = flm.api.endpoint;
        templateVars.selectedEntries = browser.selectedEntries;
//                options.selectedTarget = !browser.selectedTarget ? '/'  :flm.getCurrentPath(browser.selectedTarget);

        templateVars.selectedTarget = !browser.selectedTarget ? '/' : browser.selectedTarget;
        templateVars.currentPath = flm.addJailPath(flm.getCurrentPath('/'));

        config.options = templateVars;

        flm.views.loadView(config, (html) => {
            self.currentDialog = diagId;
            self.createDialog(diagId, html, config, viewEvents, what);

            theDialogManager.show(diagId);
        });

    }

    return self;
}