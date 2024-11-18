export function FileManagerActions() {
    let self = this;

    self.inaction = false;
    self.notification = null;

    self.cleanactions = () => {

        $(".fMan_Stop").attr('disabled', true);
    }

    self.doArchive = function (archive, files, options, cPath) {

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
            .done(function (response) {
                flm.actions.refreshIfCurrentPath(flm.utils.basedir(archive));

                return response;
            });
    };

    self.doChecksumCreate = function (filePaths, checksumFile) {
        let hasError;

        if (!checksumFile.length) {
            hasError = theUILang.fDiagSFVempty;
        } else if (!$type(filePaths) || filePaths.length === 0) {
            hasError = 'Empty paths';
        } else if (!flm.utils.isValidPath(checksumFile)) {
            hasError = theUILang.fDiagInvalidname;
        }

        if ($type(hasError)) {
            var def = $.Deferred();
            def.reject({errcode: theUILang.fcSFV, msg: hasError + ': ' + checksumFile});
            return def.promise();
        }

        flm.actions.notify(theUILang.fStarts.create_sfv + ": "
            + flm.utils.basename(checksumFile) + ' <- ' + filePaths.length + " files"
        );

        return flm.api.sfvCreate(flm.stripJailPath(checksumFile), flm.getFullPaths(filePaths))
            .done(function (response) {
                flm.actions.refreshIfCurrentPath(flm.utils.basedir(checksumFile));
                flm.actions.notify(theUILang.flm_popup_sfv_create + ": " + checksumFile, 'success', 10000);

                return response;
            });
    };

    self.doChecksumVerify = function (checksumFile) {
        let hasError;
        if (!checksumFile.length) {
            hasError = theUILang.fDiagSFVempty;
        } else if (!flm.utils.isValidPath(checksumFile)) {
            hasError = theUILang.fDiagInvalidname;
        }
        if ($type(hasError)) {
            var def = $.Deferred();
            def.reject({errcode: theUILang.fcheckSFV, msg: hasError + ': ' + checksumFile});
            return def.promise();
        }
        flm.actions.notify(theUILang.fStarts.check_sfv + ": " + flm.utils.basename(checksumFile));

        return flm.api.sfvCheck(checksumFile)
            .then(function (response) {
                flm.actions.notify(theUILang.fDiagSFVCheckf + " " + flm.utils.basename(checksumFile), 'success', 10000);
                return response;
            });

    }

    self.doCopy = function (destination, filePaths) {

        destination = flm.stripJailPath($.trim(destination));

        var deferred = $.Deferred();
        //flm.manager.logConsole(theUILang.fStarts.copy, filePaths.length + " files");

        if (!$type(filePaths) || filePaths.length === 0) {
            deferred.reject({errcode: 'copy', msg: 'Empty paths'});
            return deferred.promise();
        }

        if (!flm.utils.isValidPath(destination)) {
            // flm.manager.logAction('copy', theUILang.fDiagInvalidname);
            deferred.reject({errcode: 'copy', msg: theUILang.fDiagInvalidname + ": " + destination});

            return deferred.promise();
        }

        // check if its empty from clipboard
        filePaths = flm.ui.filenav.getSelectedTarget() ? flm.getFullPaths(filePaths) : filePaths;

        self.notify(theUILang.fStarts.copy + ": " + filePaths.length + " files");

        return flm.api.copy(filePaths, destination)
            .then(function (result) {
                    // refresh in case we are in destination
                    flm.actions.refreshIfCurrentPath(destination);
                    flm.actions.notify(theUILang.flm_popup_copy + ": " + filePaths.length, 'success', 10000);
                    return result;
                },
                function (response) {
                    return response;
                });
    }

    self.doDelete = function (paths) {

        var deferred = $.Deferred();

        if (!$type(paths) || paths.length === 0) {
            deferred.reject({errcode: 'delete', msg: 'Empty paths'});
            return deferred.promise();
        }

        paths = flm.getFullPaths(paths);
        const cPath = flm.getCurrentPath();
        flm.actions.notify(theUILang.fStarts.delete + ": " + paths.length + " files");

        return flm.api.removeFiles(paths).then(function (result) {
            flm.actions.refreshIfCurrentPath(cPath);
            $(document).trigger(flm.EVENTS.delete, [paths]);
            return result;
        });
    }

    self.doExtract = function (archiveFiles, toDir, password) {

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
            password.val()
        ).then(function (response) {
                flm.actions.refreshIfCurrentPath(toDir);
                return response;
            },
            function (response) {
                return response;
            });
    }

    self.doMove = function (filePaths, destination) {

        destination = flm.stripJailPath($.trim(destination));

        var deferred = $.Deferred();

        if (!$type(filePaths) || filePaths.length === 0) {
            deferred.reject({errcode: 'move', msg: 'Empty paths'});
            return deferred.promise();
        }

        if (!flm.utils.isValidPath(destination)) {
            deferred.reject({errcode: 'move', msg: theUILang.fDiagInvalidname + ": " + destination});
            return deferred.promise();
        }

        filePaths = flm.ui.filenav.getSelectedTarget() ? flm.getFullPaths(filePaths) : filePaths;
        var cPath = flm.getCurrentPath();

        flm.actions.notify(theUILang.fStarts.move + " " + filePaths.length + " files");

        return flm.api.move(filePaths, destination)
            .then(function (result) {

                    flm.actions.refreshIfCurrentPath(destination) || flm.actions.refreshIfCurrentPath(cPath);

                    $(document).trigger(flm.EVENTS.move, [filePaths, destination]);
                    flm.actions.notify(theUILang.flm_popup_move + ": " + filePaths.length, 'success', 10000);

                    return result;
                },
                function (response) {
                    return response;
                });
    }

    self.doNewDir = (dirName) => {
        dirName = flm.utils.basename(dirName);
        let hasError;

        if (!dirName) {
            hasError = theUILang.fDiagInvalidname;
        } else if (flm.ui.filenav.fileExists(dirName)) {
            hasError = theUILang.fDiagAexist;
        }

        if ($type(hasError)) {
            var def = $.Deferred();
            def.reject({errcode: theUILang.fcNewDir, msg: hasError + ' - ' + dirName});
        }

        return $type(hasError)
            ? def.promise()
            : flm.api.mkDir(flm.getCurrentPath(dirName))
                .done(function (response) {
                    flm.Refresh();
                    return response;
                });

    }

    self.doRename = function (source, destination, cPath) {

        let hasError;

        if (!flm.utils.isValidPath(destination)) {
            hasError = theUILang.fDiagInvalidname;
        } else if (flm.utils.basename(destination) === flm.utils.basename(source)
            || flm.ui.filenav.fileExists(destination)) //dir check
        {
            hasError = theUILang.fDiagAexist;
        }

        if ($type(hasError)) {
            var def = $.Deferred();
            def.reject({
                errcode: theUILang.fDiagRenameBut + ' ' + flm.utils.basename(source),
                msg: flm.utils.basename(destination) + ' - ' + hasError
            });
            return def.promise();
        }

        return flm.api.rename(source, destination).done(
            function (response) {
                flm.actions.refreshIfCurrentPath(cPath);
                $(document).trigger(flm.EVENTS.rename, [source, destination]);
                return response;
            }
        );

    };

    self.logAction = (action, text) => {
        flm.ui.console.show(action + ': ' + text);
    }

    self.logConsole = (text) => {
        const ts = Math.floor(Date.now() / 1000);
        flm.ui.console.logMsg(flm.ui.formatDate(ts) + " " + text);
    }

    self.refreshIfCurrentPath = (path) => {
        // refresh in case we are in path
        if (!flm.utils.isDir(path)) {
            // when destination is a directory name
            path = flm.utils.basedir(path)
        }

        const same = (path === flm.getCurrentPath());
        same && flm.Refresh()
        return same;
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

         flm.actions.logConsole(contents);
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
