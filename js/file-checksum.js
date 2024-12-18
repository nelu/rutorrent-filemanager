flm.ui.dialogs.setDialogConfig('checksum_check',
    {
        modal: true,
        pathbrowse: true,
        template: "dialog-checksum_check"
    })
    .setDialogConfig('checksum_create',
        {
            modal: true,
            pathbrowse: true,
            multiselectFilesOnly: true,
            template: "dialog-checksum_create"
        });



flm.utils.isChecksumFile = (f) => {
    return flm.utils.fileMatches(f, Object.values(flm.config.extensions.checksum).join('|'));
};

flm.utils.extTypes.checksum = (ext) => flm.utils.isChecksumFile(ext);


flm.api.checksumVerify = function (path) {
    return this.runTask("checksum-verify", {
        method: 'checksumVerify',
        target: path
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

flm.actions.doChecksumCreate = function (filePaths, checksumFile, type) {
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

flm.actions.doChecksumVerify = function (checksumFile) {
    let hasError;
    if (!checksumFile.length) {
        hasError = theUILang.flm_checksum_empty_file;
    } else if (!flm.utils.isValidPath(checksumFile)) {
        hasError = theUILang.fDiagInvalidname;
    }
    if ($type(hasError)) {
        var def = $.Deferred();
        def.reject({errcode: theUILang.flm_checksum_menu_check, msg: hasError + ': ' + checksumFile});
        return def.promise();
    }
    flm.actions.notify(theUILang.fStarts.check_sfv + ": " + flm.utils.basename(checksumFile));

    return flm.api.checksumVerify(checksumFile)
        .then(function (response) {
            flm.actions.notify(theUILang.flm_checksum_file + " " + flm.utils.basename(checksumFile), 'success', 10000);
            return response;
        });

};