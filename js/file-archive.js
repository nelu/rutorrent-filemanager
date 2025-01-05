import {FlmDirBrowser} from "./ui-dialogs.js";


class FlmArchiveBrowser extends FlmDirBrowser {

    constructor(a, b, c, d) {
        super(a, b, c, d);
        this.showFindBtn();
    }

    hide(notify = true) {
        let r = super.hide(notify);
        this.showFindBtn();
        return r;
    }

    showFindBtn() {
        this.btn.html('<icon class="flm-sprite flm-icon-search"></icon>').removeClass('p-1').addClass('p-0');
    }

    show() {
        let r = super.show();
        this.btn.removeClass('p-0').addClass('p-1');
        return r;
    }

    selectItem() {
    }

    request() {
        let r = {files: [], directories: [], path: this.edit.val()};

        return flm.api.archiveList(this.edit.val()).then((list) => {
            list.map((v) => {
                v && (v.type === 'd' && r.directories.push(flm.utils.rtrim(v.name, '/')) || r.files.push(v.name));
            });
            return r;
        });
    }
}

class FlmArchive {

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
            return flm.api.archiveCreate(flm.stripJailPath(archive), flm.getFullPaths(filePaths), options);
        }).done(function () {
            flm.actions.refreshIfCurrentPath(flm.utils.basedir(archive)) || flm.actions.refreshIfCurrentPath(cPath);
            //$(document).trigger(flm.EVENTS.move, [archiveFiles, destination, cPath]);
            //flm.actions.notify(theUILang.flm_popup_move + ": " + archiveFiles.length, 'success', 10000);
        });

        return validation;
    };

    doExtract = function (checklist, path, options) {
        let destination = flm.stripJailPath($.trim(path.val()));
        let archiveFiles = flm.ui.dialogs.getCheckedList(checklist);

        let validation = flm.actions.doValidation([
            [archiveFiles.length === 0, theUILang.flm_empty_selection, checklist.length > 1 ? checklist.find('input').get(0) : checklist[0]],
            [!destination.length || !flm.utils.isDir(destination), theUILang.fDiagNoPath, path]
        ]);

        //archiveFiles = flm.ui.filenav.getSelectedTarget() ? flm.getFullPaths(archiveFiles) : archiveFiles;

        validation.then(() => {
            return flm.api.archiveExtract(archiveFiles, destination, options);
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

    setArchiveBrowser = (diagId, inputId) => flm.ui.dialogs.setDirBrowser(diagId,
        new FlmArchiveBrowser(inputId, true, undefined, flm.config.homedir)
    )

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

flm.api.archiveCreate = function (archive, files, options) {
    return this.runTask("compress", {
        method: 'archiveCreate',
        target: archive,
        options: options,
        fls: files
    });
};

flm.api.archiveExtract = function (archiveFiles, toDir, options = {}) {
    return this.runTask("unpack", {
        method: 'archiveExtract',
        fls: archiveFiles,
        options: options,
        to: toDir
    });
};

flm.api.archiveList = function (archiveFile, options = {}) {
    return this.post({
        method: 'archiveList',
        target: archiveFile,
        options: options,
    });
};


flm.archive = new FlmArchive(flm.config);

flm.utils.extTypes.archive = (ext) => flm.archive.isArchive(ext);