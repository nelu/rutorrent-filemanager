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

        flm.ui.filenav.onSetEntryMenu(this.setContextMenu);
    }

    settings = (type) => {
        return type && flm.config.archives[type] || flm.config.archives;
    }
    doArchive = function (path, checklist, options) {

        let cPath = flm.getCurrentPath();
        let archive = flm.stripJailPath($.trim(path.val()));
        let filePaths = flm.ui.dialogs.getCheckedList(checklist);

        let validation = flm.actions.doValidation([
            [!$type(filePaths) || filePaths.length === 0, theUILang.fErrMsg[22], checklist.find('input').get(0)],
            [!flm.utils.isValidPath(archive), path.data("msgRequired"), path],
            [flm.ui.filenav.fileExists(archive), path.data("msgExists"), path]
        ]);

        validation.then(() => {
            return flm.api.createArchive(flm.stripJailPath(archive), flm.getFullPaths(filePaths), options);
        }).done(function () {
            flm.actions.refreshIfCurrentPath(flm.utils.basedir(archive)) || flm.actions.refreshIfCurrentPath(cPath);
            //$(document).trigger(flm.EVENTS.move, [archiveFiles, destination, cPath]);
            //flm.actions.notify(theUILang.flm_popup_move + ": " + archiveFiles.length, 'success', 10000);
        });

        return validation;
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
            return flm.api.extractFiles(archiveFiles, destination, password.val());
        }).done(function () {
            flm.actions.refreshIfCurrentPath(destination);
            //$(document).trigger(flm.EVENTS.move, [archiveFiles, destination, cPath]);
            //flm.actions.notify(theUILang.flm_popup_move + ": " + archiveFiles.length, 'success', 10000);
        });

        return validation;
    }

    isArchive = function (element) {
        return flm.utils.fileMatches(element, this.config.extensions.fileExtract);
    }

    setContextMenu = (menu, path) => {
        let self = this;
        let createMenu = flm.ui.getContextMenuEntryPosition(menu, theUILang.fcreate, 1);
        if (createMenu > -1) {
            let submenu = menu[createMenu][2];
            let newdir = flm.ui.getContextMenuEntryPosition(submenu, theUILang.fcNewDir);
            if (newdir > -1) {
                submenu.splice(++newdir, 0, [theUILang.fcNewArchive, () => self.showCreate()]);
            }
        }

        if (self.isArchive(path)) {
            let rename = flm.ui.getContextMenuEntryPosition(menu, theUILang.fRename) + 2;
            menu.splice(rename, 0, [theUILang.fExtracta, () => self.showExtract()]);
            menu.splice(++rename, 0, [CMENU_SEP]);
        }
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