export function FileManagerActions() {
    let self = this;

    self.inaction = false;
    self.notification = null;

    self.cleanactions = () => {

        $(".fMan_Stop").attr('disabled', true);
    }

    this.doCopy = function (checklist, path) {

        let cPath = flm.getCurrentPath();
        let destination = flm.stripJailPath($.trim(path.val()));
        let filePaths = flm.ui.dialogs.getCheckedList(checklist);

        let validation = self.doValidation([
            [!$type(filePaths) || filePaths.length === 0, theUILang.flm_empty_selection, checklist.find('input').get(0)],
            [!flm.utils.isValidPath(destination), path.data("msgRequired"), path],
            [destination === cPath, path.data("msgExists"), path]
        ]);

        // check if its empty from clipboard
        filePaths = flm.ui.filenav.getSelectedTarget() ? flm.getFullPaths(filePaths) : filePaths;

        validation.then(() => {
            self.notify(theUILang.fStarts.copy + ": " + filePaths.length + " files");
            return flm.api.copy(filePaths, destination);
        }).done(function () {
            // refresh in case we are in destination
            flm.refreshIfCurrentPath(destination);
            flm.actions.notify(theUILang.flm_popup_copy + ": " + filePaths.length, 'success', 10000);
        });

        return validation;
    }

    self.doDelete = function (checklist) {
        let paths = flm.ui.dialogs.getCheckedList(checklist);
        const cPath = flm.getCurrentPath();

        let validation = self.doValidation([
            [!$type(paths) || paths.length === 0, theUILang.flm_empty_selection, checklist.find('input').get(0)],
        ]);

        validation.then(() => {
            paths = flm.getFullPaths(paths);
            flm.actions.notify(theUILang.fStarts.delete + ": " + paths.length + " files");
            return flm.api.removeFiles(paths);
        }).done(() => {
            //TODO: create event listeners for flm.refreshIfCurrentPath
            flm.refreshIfCurrentPath(cPath);
            $(document).trigger(flm.EVENTS.delete, [paths, cPath]);
        });

        return validation;
    }

    self.doMove = function (checklist, path) {
        let cPath = flm.getCurrentPath();
        let destination = flm.stripJailPath($.trim(path.val()));
        let filePaths = flm.ui.dialogs.getCheckedList(checklist);

        let validation = self.doValidation([
            [!$type(filePaths) || filePaths.length === 0, theUILang.flm_empty_selection, checklist.find('input').get(0)],
            [!flm.utils.isValidPath(destination), path.data("msgRequired"), path],
            [destination === cPath, path.data("msgExists"), path]
        ]);

        filePaths = flm.ui.filenav.getSelectedTarget() ? flm.getFullPaths(filePaths) : filePaths;

        validation.then(() => {
            self.notify(theUILang.fStarts.move + " " + filePaths.length + " files");
            return flm.api.move(filePaths, destination);
        }).done(function () {
            flm.refreshIfCurrentPath(destination) || flm.refreshIfCurrentPath(cPath);
            $(document).trigger(flm.EVENTS.move, [filePaths, destination, cPath]);
            flm.actions.notify(theUILang.flm_popup_move + ": " + filePaths.length, 'success', 10000);
        });

        return validation;
    }

    this.doNewDir = (path) => {
        const dirName = flm.utils.basename(path.val());

        let validation = self.doValidation([
            [!dirName.length || flm.utils.isValidPath(path.val()), path.data("msgRequired")],
            [() => flm.ui.filenav.fileExists(dirName), path.data("msgExists")],
        ], (msg) => ({
            errcode: theUILang.fcNewDir,
            msg: msg + ' - ' + dirName,
            fields: [{input: path, err: msg}]
        }));

        validation.then(() => flm.api.mkDir(flm.getCurrentPath(dirName)))
            .done(() => flm.refreshIfCurrentPath(flm.getCurrentPath(dirName)));

        return validation;
    }

    this.doRename = function (source, path) {
        const cPath = flm.getCurrentPath();
        source = flm.utils.buildPath([cPath, flm.utils.basename(source)]);

        let destination = flm.utils.buildPath([cPath, flm.utils.basename(path.val())]);

        let validation = self.doValidation([
            [!flm.utils.isValidPath(destination) || !flm.utils.basename(path.val()).length, path.data("msgRequired")],
            [() => flm.utils.basename(destination) === flm.utils.basename(source) || flm.ui.filenav.fileExists(destination), path.data("msgExists")]
        ], (msg) => ({
            errcode: theUILang.fDiagRenameBut + ' ' + flm.utils.basename(source),
            msg: flm.utils.basename(destination) + ' - ' + msg,
            fields: [{input: path, err: msg}]
        }));

        validation.then(() => flm.api.rename(source, destination))
            .done((response) => {
                flm.refreshIfCurrentPath(cPath);
                $(document).trigger(flm.EVENTS.rename, [source, destination]);
                return response;
            });

        return validation;
    };

    self.doValidation = (filters, formatMsg) => {
        let d = $.Deferred();
        formatMsg = formatMsg || function (msg, input) {
            return {fields: [{input: input, err: msg}]};
        };

        let errs = filters.reduce((accumulator, currentValue) => {
            let validation = currentValue[0];
            if (!accumulator && ($type(validation) === 'function' ? validation.apply(self, []) : validation)) {
                return d.reject($type(formatMsg) && formatMsg(currentValue[1], currentValue[2]) || currentValue[1]);
            } else {
                return accumulator;
            }

        }, false);

        return errs || d.resolve();
    };

    self.logAction = (action, text) => {
        flm.ui.console.show(action + ': ' + text);
    }

    self.logConsole = (text) => {
        const ts = Math.floor(Date.now() / 1000);
        flm.ui.console.logMsg(flm.ui.formatDate(ts) + " " + text);
    }

    self.notify = (contents, color = 'information', hideAfter = 5000) => {
        self.notification = $.noty(
            {
                text: contents,
                layout: 'bottomLeft',
                type: color,
                timeout: hideAfter,
                closeOnSelfClick: true
            });

        self.logConsole(contents);
    }

    self.doMediainfo = (target) => {
        theWebUI.startConsoleTask("mediainfo", flm.getPlugin().name, {
            'action': 'fileMediaInfo', 'target': target
        }, {noclose: true});

    }

    self.createTorrent = function (target) {
        var relative = flm.stripJailPath(target);
        var isRelative = (relative !== target);

        var path = flm.addJailPath(isRelative ? relative : target);

        $('#path_edit').val(path);

        if ($('#tcreate').css('display') === 'none') {
            theWebUI.showCreate();
        }
    }

    return self;
}
