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

class FlmArchive   {

    config = {};

    constructor(config) {
        this.config = config;
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

    doExtract = function (archiveFiles, toDir, password) {

        var deferred = $.Deferred();
        toDir = flm.stripJailPath(toDir)

        if (!toDir.length || !flm.utils.isDir(toDir)) {
            deferred.reject({errcode: theUILang.fDiagNoPath, msg: toDir});
            return deferred.promise();
        }

        if (!$type(archiveFiles) || archiveFiles.length === 0) {
            deferred.reject({errcode: 'extract', msg: 'Empty paths'});
            return deferred.promise();
        }

        return flm.api.extractFiles(
            flm.getFullPaths(archiveFiles),
            toDir,
            password
        ).then(function (response) {
                flm.actions.refreshIfCurrentPath(toDir);
                return response;
            },
            function (response) {
                flm.actions.refreshIfCurrentPath(toDir);
                return response;
            });
    }

    isArchive = function (element) {
        return flm.utils.fileMatches(element, flm.config.extensions.fileExtract);
    };

    onShowCreate = function (dialog) {
        const diagId = dialog.getCurrentDialog();
        var settings = this.config['archives'];

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
            dialogs.onStart(() => flm.archive.doExtract(
                    dialogs.getCheckedList(diagId),
                    dialogs.getTargetPath(diagId)),
                password.val()
            );
    }

    showCreate = () => {
        flm.ui.dialogs.showDialog('archive_create');
    }

    showExtract = () => {
        let self = this;
        flm.ui.filenav.selectedEntries = flm.ui.filenav.selectedEntries.reduce((archives, entry) => {
            self.isArchive(entry) && archives.push(entry)
            return archives;
        }, []);

        flm.ui.dialogs.showDialog('archive_extract');
    }
}

flm.archive = new FlmArchive(flm.config.archives);

flm.utils.extTypes.archive = (ext) => flm.archive.isArchive(ext);