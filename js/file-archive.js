flm.api.createArchive = function (archive, files, options) {
    return this.runTask("compress", {
        method: 'filesCompress',
        target: archive,
        mode: options,
        fls: files
    });
};

flm.api.extractFiles = function (archiveFiles, toDir, password) {
    return this.runTask("unpack", {
        method: 'filesExtract',
        fls: archiveFiles,
        password: password,
        to: toDir
    });
};

class FlmArchive {

    config = {};

    constructor(config) {
        this.config = config;
        let self = this;
        flm.ui.dialogs.setDialogConfig('archive_create',
            {
                modal: true,
                pathbrowse: true,
                template: "dialog-archive_create"
            })
            .setDialogConfig('archive_extract',
                {
                    modal: true,
                    pathbrowse: true,
                    template: "dialog-archive_extract"
                });

        flm.ui.filenav.onSetEntryMenu((menu, path) => {
            let createMenu = flm.ui.getContextMenuEntryPosition(menu, theUILang.fcreate, 1);
            if (createMenu > -1) {
                let submenu = menu[createMenu][2];
                let newdir = flm.ui.getContextMenuEntryPosition(submenu, theUILang.fcNewDir);
                if (newdir > -1) {
                    submenu.splice(++newdir, 0, [theUILang.fcNewArchive, () => self.showCreate()]);
                }
            }

            if (flm.archive.isArchive(path)) {
                let rename = flm.ui.getContextMenuEntryPosition(menu, theUILang.fRename) + 2;
                menu.splice(rename, 0, [theUILang.fExtracta, () => flm.archive.showExtract()]);
                menu.splice(++rename, 0, [CMENU_SEP]);
            }
        });
    }

    doArchive = function (archive, files, options, cPath) {

        let hasError;

        if (!archive.length) {
            hasError = theUILang.fDiagNoPath;
        } else if (!$type(files) || files.length === 0) {
            hasError = theUILang.fErrMsg[22];
        } else if (!flm.utils.isValidPath(archive)) {
            hasError = theUILang.fDiagInvalidname;
        }

        if ($type(hasError)) {
            var def = $.Deferred();
            def.reject({errcode: theUILang.fDiagArchive, msg: hasError + ' - ' + archive});

            return def.promise();
        }

        return flm.api.createArchive(flm.stripJailPath(archive), flm.getFullPaths(files), options)
            .done((response) => {
                flm.actions.refreshIfCurrentPath(flm.utils.basedir(archive)) || flm.actions.refreshIfCurrentPath(cPath);
                return response;
            });
    };

    doExtract = function (checklist, path, password) {
        let destination = flm.stripJailPath($.trim(path.val()));
        let archiveFiles = flm.ui.dialogs.getCheckedList(checklist);

        let validation = flm.actions.doValidation([
            [!$type(archiveFiles) || archiveFiles.length === 0, theUILang.flm_empty_selection, checklist.find('input').get(0)],
            [!destination.length || !flm.utils.isDir(destination), theUILang.fDiagNoPath, path]
        ]);

        archiveFiles = flm.ui.filenav.getSelectedTarget() ? flm.getFullPaths(archiveFiles) : archiveFiles;

        validation.then(() => {
            return flm.api.extractFiles(archiveFiles, destination, password);
        }).done(function () {
            flm.actions.refreshIfCurrentPath(destination);
            //$(document).trigger(flm.EVENTS.move, [archiveFiles, destination, cPath]);
            //flm.actions.notify(theUILang.flm_popup_move + ": " + archiveFiles.length, 'success', 10000);
        });
    }

    isArchive = function (element) {
        return flm.utils.fileMatches(element, this.config.extensions.fileExtract);
    };

    onShowCreate = function (dialog) {
        const diagId = dialog.getCurrentDialog();
        var settings = this.config.archives;

        var pathBrowser = dialog.dirBrowserInput(diagId);
        var archiveType = $("#fMan_archtype");
        var compression = $("#fman-archive-archcompr");
        var password = $("#fman-archive-apassword");
        var volumeSize = $("#fman-archive-vsize");
        var format = $('#fman-archive-arcnscheme');
        var pass = $(diagId + ' .fman-archive-settings-pass');
        const cPath = flm.getCurrentPath();

        let self = this;
        // service

        self.updateCompression = function () {
            var type = archiveType.val().toLowerCase();
            $('.fman-archive-settings-rar').show();

            if (type !== 'xxx') {
                $('.fman-archive-settings-rar').show();
            } else {
                $('.fman-archive-settings-pass,.fman-archive-settings-rar').hide();

                $('.fman-archive-settings-pass').show();
            }

            compression.empty();
            for (var i = 0; i < settings[type].compression.length; i++) {
                compression.append('<option value="' + i + '">' + theUILang.fManArComp['zip'][i] + '</option>');
            }
        }

        self.updateFilePath = function (path) {
            const extensions = $.uniqueSort(Object.keys(settings)).join('|');
            const extension = archiveType.val().toLowerCase();
            let filePath = flm.utils.replaceFilePath(path.val(), path.data('previousValue'), extensions, extension);
            dialog.updateTargetPath(diagId, filePath);
        }

        self.onFormatChange = function () {
            self.updateFilePath(pathBrowser);
            self.updateCompression();
            var typeOpts = settings[archiveType.val().toLowerCase()];

            if ($type(typeOpts['has_password']) && typeOpts['has_password'] === false) {
                pass.hide();
            } else {
                pass.show();
            }
        };

        dialog.onStart(() => flm.archive.doArchive(
            dialog.getTargetPath(diagId),
            dialog.getCheckedList(diagId),
            {
                type: archiveType.val(),
                compression: compression.val(),
                password: password.val(),
                volumeSize: volumeSize.val(),
                format: format.val()
            },
            cPath
        ));

        archiveType.change(self.onFormatChange);

        pathBrowser.change(function (event) {
            self.updateFilePath($(this));
        });

        if (!archiveType.find('option').length) {
            for (var type in settings) {
                archiveType.append('<option value="' + type + '">' + type.toUpperCase() + '</option>');
            }
        }

        self.updateFilePath(pathBrowser);
        self.updateCompression();

    }

    onShowExtract(dialogs) {
        const diagId = dialogs.getCurrentDialog();
        let password = $("#fman-extract-password");

        // form submit
        dialogs.onStart(() => this.doExtract(
                dialogs.getCheckList(diagId),
                dialogs.dirBrowserInput(diagId),
                password
            )
        );
    }

    showCreate = () => {
        flm.ui.dialogs.showDialog('archive_create');
    }

    showExtract = () => {
        flm.ui.filenav.selectedEntries = flm.ui.filenav.selectedEntries.filter((entry) => this.isArchive(entry), this);
        flm.ui.dialogs.showDialog('archive_extract');
    }
}

flm.archive = new FlmArchive(flm.config);

flm.utils.extTypes.archive = (ext) => flm.archive.isArchive(ext);