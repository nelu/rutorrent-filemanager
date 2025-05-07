export class FlmDirBrowser extends theWebUI.rDirBrowser {

    xhr = null;
    stripTopdir = false;

    constructor(a, b, c, stripPaths) {
        super(a, b, c);
        flm.utils.setValidation(this.edit);
        this.stripTopdir = stripPaths || false;

        this.btn.addClass(['m-0', 'p-1']);
        this.edit.on('change', () => {
//            data('previousValue', this.edit.val()})
        });
    }

    hide(notify = true) {
        notify && this.edit.change();
        return super.hide();
    }

    selectItem(ev) {
        super.selectItem(ev);
        this.edit.val(flm.stripJailPath(this.edit.val()));
        //this.edit.change();
    }


    setFilter(expression) {
        this.frame.find('.filter-dir').val(expression);
    }

    request(path) {
        return $.ajax(
            `plugins/_getdir/listdir.php?dir=${encodeURIComponent(path)}&time=${(new Date()).getTime()}${this.withFiles ? "&withfiles=1" : ""}`
        );
    }

    requestDir() {

        let path = this.stripTopdir
            ? [this.stripTopdir, this.edit.val()].join('/')
            : this.edit.val();

        if (!flm.utils.isDir(path)) {
            path = flm.utils.basedir(path);
        }

        this.xhr = this.request(path).then(
            (res) => {
                if (this.stripTopdir) {
                    res.path = flm.utils.stripBasePath(res.path, this.stripTopdir)
                }
                this.frame.find(".filter-dir").val("").trigger("focus");
                this.edit.val(res.path).data({cwd: res.path, previousValue: this.edit.val()}).change();
                this.frame.find(".rmenuobj").remove();
                this.frame.append(
                    $("<div>").addClass("rmenuobj").append(
                        ...res.directories.map(ele => $("<div>").addClass("rmenuitem").text(ele + "/")),
                        ...(this.withFiles ? res.files : []).map(ele => $("<div>").addClass("rmenuitem").text(ele)),
                    ),
                );
                this.frame.find(".rmenuitem").on(
                    "click", (ev) => this.selectItem(ev)
                ).on(
                    "dblclick", (ev) => (ev.currentTarget.innerText.endsWith("/")) ? this.requestDir() : this.hide()
                );
            },
            (res) => console.log(res)
        );

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

    this.forms = {
        copy: {
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
        }, permissions: {
            modal: false,
            template: "dialog-permissions"
        }, rename: {
            modal: true,
            template: "dialog-rename"
        },
        nfo_view: {
            modal: false,
            template: "dialog-nfo_view"
        }
    };

    this.currentDialog = "window";
    this.onStartEvent = null;
    this.startedPromise = null;
    this.dirBrowser = {}; // multiple file operations are ui blocking

    self.bindKeys = (diagId) => {
        $("#" + diagId).keydown(function (e) {
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
            $("#" + diagId).select().focus();
        });
    }
    // common dialog cleanup
    this.afterHide = function (dialogId, what) {

        let diagConf = self.getDialogConfig(what);
        const persistentDiag = ($type(diagConf.persist) && diagConf.persist);

        if (self.dirBrowser.hasOwnProperty(dialogId)) {
            for (let i in self.dirBrowser[dialogId]) {
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
    this.beforeShow = function (diagId) {
        setTimeout(function () {
            self.startButton(diagId).select().focus();
        });
    }

    this.startButton = function (diag) {
        diag = flm.utils.ltrim(diag, '#');
        return $(`#${diag} .flm-diag-start`);
    }

    this.disableStartButton = function (diag) {
        return self.startButton(diag).attr('disabled', true);
    }

    this.enableStartButton = function (diag) {
        return self.startButton(diag).attr('disabled', false);
    }

    this.getCheckList = (diag) => {
        return $("#" + flm.utils.ltrim(diag, "#") + ' .checklist .form-check');
    }

    this.getCheckedList = function (checklist) {
        const t = $type(checklist);

        if (t !== 'array') {
            checklist = (t === 'object' && checklist || self.getCheckList(checklist)).find(':checked');
        }

        return Array.from(checklist).map((input) => decodeURIComponent($(input).val()));
    }

    self.getCurrentDialog = () => {
        return self.currentDialog;
    }

    this.getDialogId = function (formId) {
        formId = formId || 'window';
        return '#' + self.getDialogsPrefix(flm.utils.ltrim(formId, '#'));
    }

    this.getDialogsPrefix = function (formId) {
        return 'flm_popup_' + formId;
    }

    this.getDialogHeader = function (diagId) {
        return $(`#${diagId}-header`);
    }

    this.getTargetPath = function (container) {
        var ele = self.dirBrowserInput(container)
        return ele[0].tagName.toLowerCase() === 'input' ? ele.val() : ele.text();
    }

    this.handleStartButton = (diagId) => {
        diagId = '#' + diagId;

        let dialogForms = Array.from(document.querySelectorAll(diagId + ' .needs-validation'));
        let validForms = dialogForms.reduce((a, form) => {
            form.checkValidity() && a++;
            form.classList.add('was-validated');
            return a;
        }, 0);

        flm.debug("Start button click " + diagId, `Valid forms ${validForms}/${dialogForms.length}`);

        if (//validForms === dialogForms.length &&
            $type(self.onStartEvent) === "function") {
            self.startedPromise = self.onStartEvent.apply(self, [diagId]);
            if (self.startedPromise.state() !== "rejected") {
                self.hide(diagId);
            }

            self.startedPromise.then((data) => {
                    if (data) {
                        data.triggerEvent && flm.triggerEvent(data.triggerEvent[0], data.triggerEvent[1]);
                        data.refresh && flm.refreshIfCurrentPath(data.refresh);
                        data.notify && flm.actions.notify(data.notify[0], 'success', $type(data.notify[1]) ? data.notify[1] : 10000);
                    }
                    return data;
                },
                (errData) => {
                    // form validation failure
                    if ($type(errData.fields)) {
                        flm.debug('fields validation not passed', diagId, errData);
                        errData.fields.map((f) => {
                            let validation = $(f.input).parent().find('.invalid-feedback');
                            $(f.input)[0].setCustomValidity(f.err);
                            validation.length && validation.html(f.err).show() || $(f.input)[0].reportValidity();

                            return f;
                        });
                    } else {
                        self.hide(diagId);
                        flm.utils.logError(errData.errcode ? errData.errcode : "", errData.msg || errData);
                    }

                    return errData;
                });
        }

    }

    this.hide = function (dialogId, afterHide) {
        dialogId = flm.utils.ltrim(dialogId, '#');
        theDialogManager.hide(dialogId, afterHide);
    }

    this.onStart = function (callback, diagId, oneTime = false) {
        diagId = diagId || self.getCurrentDialog();
        let btn = self.enableStartButton(diagId);
        const method = oneTime ? 'one': 'on';
        btn[method].apply(btn, ['click',() => {
            self.startedPromise = null;
            self.onStartEvent = callback;
            self.handleStartButton(diagId);
        }]);

        return this;
    }

    this.show = function (dialogId, afterShow) {
        dialogId = dialogId || 'window';
        theDialogManager.show(flm.utils.ltrim(dialogId, '#'), afterShow);
    }

    this.updateTargetPath = function (container, path) {
        var ele = self.dirBrowserInput(container);
        //path = flm.addJailPath(path);
        return ele[0].tagName.toLowerCase() === 'input' ? ele.val(path) : ele.text(path);
    }

    this.dirBrowserInput = function (diagId) {
        diagId = '#' + flm.utils.ltrim(diagId, '#');
        return $(diagId + '.dlg-window .flm-diag-nav-path');
    }

    this.getDirBrowser = (diagId) => {
        return self.dirBrowser.hasOwnProperty(diagId) && self.dirBrowser[diagId];
    };

    this.createDirBrowser = function (diagId, withFiles) {
        diagId = flm.utils.ltrim(diagId, '#');
        let inputSelectors = $('#' + diagId + ' .flm-diag-nav-path');

        if (thePlugins.isInstalled("_getdir")) {

            for (var i = 0; i < inputSelectors.length; i++) {
                let rdb = new FlmDirBrowser(inputSelectors[i].id, withFiles, undefined, flm.config.homedir);
                self.setDirBrowser(diagId, rdb);
            }
        }
    }

    this.setDirBrowser = function (diagId, browser) {
        if (!self.dirBrowser.hasOwnProperty(diagId)) {
            self.dirBrowser[diagId] = {};
        }
        self.dirBrowser[diagId][browser.edit.id] = browser;
    }

    self.createDialog = (diagId, content, config, viewEvents, what) => {

        viewEvents = viewEvents || {};

        // create it
        // if (!theDialogManager.items.hasOwnProperty(diagId)) {
        theDialogManager.make(diagId, theUILang['flm_popup_' + what], content, config.modal); // prevent the user from changing table selection by default
        $type(config.pathbrowse) && config.pathbrowse && self.createDirBrowser(diagId, config.pathbrowseFiles);

        self.getDialogHeader(diagId)
            .prepend('<icon class="flm-sprite-diag flm-sprite sprite-' + what + '"></icon>');

        self.bindKeys(diagId);

        const eventNames = ['beforeHide', 'beforeShow', 'afterHide', 'afterShow'];

        for (let i = 0; i < eventNames.length; i++) {
            const evName = eventNames[i];
            theDialogManager.setHandler(diagId, evName, function () {
                $type(self[evName]) && self[evName].apply(self, [diagId, what]);
                viewEvents.hasOwnProperty(evName) && viewEvents[evName].apply(self, [diagId, what]);
            });
        }

    }

    self.deleteDialog = (dialogId) => {
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

    this.showDialog = function (what, viewEvents) {

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
            templateVars.currentPath = flm.getCurrentPath('/');

            config.options = templateVars;

            flm.views.loadView(config, (html) => {
                self.createDialog(diagWindow, html, config, viewEvents, what);
                theDialogManager.show(diagWindow);
            });
        } else {
            theDialogManager.show(diagWindow);
        }

    }

    return this;
}