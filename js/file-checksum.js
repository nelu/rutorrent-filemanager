flm.ui.dialogs.setDialogConfig('checksum_check',
    {
        modal: true,
        pathbrowse: true,
        pathbrowseFiles: true,
        template: "dialog-checksum_check"
    })
    .setDialogConfig('checksum_create',
        {
            modal: true,
            pathbrowse: true,
            pathbrowseFiles: true,
            multiselectFilesOnly: true,
            template: "dialog-checksum_create"
        });


flm.api.checksumVerify = function (path, type) {
    return this.runTask("checksum-verify", {
        method: 'checksumVerify',
        target: path,
        type: type
    });
};

flm.api.checksumCreate = function (path, files, type) {
    return this.runTask("checksum-create", {
        method: 'checksumCreate',
        target: path,
        fls: files,
        type: type
    });
};

function FlmChecksum() {
    let self = this;
    let dialog = flm.ui.getDialogs();
    const checksumTypesExt = flm.config.extensions.checksum;

    this.isChecksumFile = (e) => {
        return flm.utils.fileMatches(e, Object.values(flm.config.extensions.checksum).join('|'));
    };

    this.doChecksumCreate = function (filePaths, checksumFile, type) {
        let hasError;

        if (!checksumFile.length) {
            hasError = theUILang.flm_checksum_empty_file;
        } else if (!$type(filePaths) || filePaths.length === 0) {
            hasError = 'Empty paths';
        } else if (!flm.utils.isValidPath(checksumFile)) {
            hasError = theUILang.fDiagInvalidname;
        }

        if ($type(hasError)) {
            var def = $.Deferred();
            def.reject({errcode: theUILang.flm_checksum_menu, msg: hasError + ': ' + checksumFile});
            return def.promise();
        }

        flm.actions.notify(theUILang.fStarts.create_sfv + ": "
            + flm.utils.basename(checksumFile) + ' <- ' + filePaths.length + " files"
        );

        //console.log("got type", type);
        return flm.api.checksumCreate(flm.stripJailPath(checksumFile), flm.getFullPaths(filePaths), type)
            .done(function (response) {
                flm.actions.refreshIfCurrentPath(flm.utils.basedir(checksumFile));
                flm.actions.notify(theUILang.flm_popup_checksum_create + ": " + checksumFile, 'success', 10000);

                return response;
            });
    };

    this.doChecksumVerify = function (checksumFile) {
        let hasError;
        if (!checksumFile.length) {
            hasError = theUILang.flm_checksum_empty_file;
        } else if (!flm.utils.isValidPath(checksumFile) || flm.utils.isDir(checksumFile)) {
            hasError = theUILang.fDiagInvalidname;
        }
        if ($type(hasError)) {
            var def = $.Deferred();
            def.reject({errcode: theUILang.flm_checksum_menu_check, msg: hasError + ': ' + checksumFile});
            return def.promise();
        }

        flm.actions.notify(theUILang.fStarts.check_sfv + ": " + flm.utils.basename(checksumFile));

        let ext = flm.utils.getExt(checksumFile);
        let type = 'CRC32';

        if (self.isChecksumFile(ext)) {
            type = Object.values(checksumTypesExt)
                .reduce(
                    (extension, key, index) => (key === extension)
                        ? Object.keys(checksumTypesExt)[index]
                        : extension
                    , ext);
        }

        return flm.api.checksumVerify(checksumFile, type)
            .then(function (response) {
                flm.actions.notify(theUILang.flm_checksum_file + " " + flm.utils.basename(checksumFile), 'success', 10000);
                return response;
            });

    };

    this.onShowCreate = function (diagId, type) {

        const cPath = flm.getCurrentPath();
        var pathBrowser = dialog.dirBrowserInput(diagId);

        let algo = () => {
            return type.find(":selected").val()
        };

        dialog.onStart(() => self.doChecksumCreate(
                dialog.getCheckedList(diagId),
                $.trim(dialog.getTargetPath(diagId)),
                algo()
            )
        );

        pathBrowser.change(function (ev) {
            const ext = checksumTypesExt[algo()];
            let filePath = flm.utils.replaceFilePath(
                $(this).val(),
                $(this).data('previousValue'),
                Object.values(checksumTypesExt), ext
            );
            dialog.updateTargetPath(diagId, filePath);

            $(this).data('previousValue', pathBrowser.val());
        });

        type.change(() => {
            pathBrowser.change();
        });
        pathBrowser.change();
    }

    return this;
}

flm.checksum = new FlmChecksum();

flm.utils.extTypes.checksum = (ext) => flm.checksum.isChecksumFile(ext);

