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
        let fileInfo = flm.ui.filenav.fileExists(flm.utils.basename(this.edit.val()));

        return flm.api.archiveList(this.edit.val(),
            {
                password: $("#fman-extract-password").val(),
                background: fileInfo[1] > 1073741824
            }).then((list) => {

            if ($type(list['log'])) {
                flm.config.debug && console.log('listing task finished', list);
                (list['finish'] > 0) && theDialogManager.hide('tskConsole');
                if (list['log'].length > 0) {
                    list = list['log'];
                } else {
                    list = thePlugins.get("_task").readConsoleLog().split('\n');
                }
            }

            $type(list) === 'array' && list.map((v) => {

                let fields = v.match(/^(?<date>(([\d-]+) ([\d:]+)|[\s]+)) ((\.+)?(?<type>[\w.])(\.+)?) (?<size>[\d\s]+) (?<perm>[\d\s]+) (?<name>.+)/);
                if (fields) {
                    let fname = fields.groups.name.trim();
                    fields.groups.type.toLowerCase() === 'd' && r.directories.push(fname) || r.files.push(fname);
                } else if (v && (v = v.trim()) !== "") {
                    r.files.push(v);
                }
            });
            return r;
        });
    }
}

class FlmArchive {

    config = {};

    constructor(config) {
        this.config = config;

        flm.EVENTS.ARCHIVE_EXTRACT = "flm.doExtract";
        flm.EVENTS.ARCHIVE_CREATE = "flm.doArchive";

        flm.onEvent('ARCHIVE_EXTRACT', (e, archiveFiles, destination) => {
            flm.actions.notify(theUILang.flm_popup_archive_extract + ': '
                + (archiveFiles.length > 1 ? archiveFiles.length + ' files' : flm.utils.basename(archiveFiles[0]))
                + ' -> ' + destination,
                'success', 6000);
        })

        flm.ui.filenav.onSetEntryMenu(this.setContextMenu);
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

    settings = (type) => {
        return type && flm.config.archives[type] || flm.config.archives;
    }
    doArchive = function (path, checklist, options) {

        let archive = flm.stripJailPath($.trim(path.val()));
        let filePaths = flm.ui.dialogs.getCheckedList(checklist);

        let validation = flm.actions.doValidation([
            [!$type(filePaths) || filePaths.length === 0, theUILang.fErrMsg[22], checklist.find('input').get(0)],
            [!flm.utils.isValidPath(archive), path.data("msgRequired"), path],
            [flm.ui.filenav.fileExists(archive), path.data("msgExists"), path]
        ]);

        return (validation.state() === "rejected")
            ? validation
            : validation.then(() => flm.api.archiveCreate(flm.stripJailPath(archive), flm.getFullPaths(filePaths), options))
                .then(function () {
                    return {
                        refresh: flm.utils.basedir(archive),
                        triggerEvent: ['ARCHIVE_CREATE', [filePaths, archive, options]],
                        notify: [theUILang.fDiagCArchiveSel + ': ' + filePaths.length + ' files' + ' -> ' + archive],
                    };
                });

    };

    doExtract = function (checklist, path, options) {
        let destination = flm.stripJailPath($.trim(path.val()));
        let archiveFiles = flm.ui.dialogs.getCheckedList(checklist);

        let validation = flm.actions.doValidation([
            [archiveFiles.length === 0, theUILang.flm_empty_selection, checklist.length > 1 ? checklist.find('input').get(0) : checklist[0]],
            [!destination.length || !flm.utils.isDir(destination), theUILang.fDiagNoPath, path]
        ]);

        return (validation.state() === "rejected") ? validation
            : validation.then(() => flm.api.archiveExtract(archiveFiles, destination, options))
                .then(function () {
                    return {
                        refresh: destination,
                        triggerEvent: ['ARCHIVE_EXTRACT', [archiveFiles, destination]]
                    };
                });
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
            flm.ui.addContextMenu(menu[createMenu][2],
                [theUILang.fcNewArchive, () => self.showCreate()],
                theUILang.fcNewDir
            );
        }

        if (self.isArchive(path)) {
            let afterRename = flm.ui.getContextMenuEntryPosition(menu, theUILang.fRename) + 2;
            menu.splice(afterRename, 0, [theUILang.fExtracta, () => self.showExtract()]);
            menu.splice(++afterRename, 0, [CMENU_SEP]);
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
    let data = {
        method: 'archiveList',
        target: archiveFile,
        options: options,
    };
    return options.background ? this.runTask("archive-list", data) : this.post(data);
};


flm.archive = new FlmArchive(flm.config);

flm.utils.extTypes.archive = (ext) => flm.archive.isArchive(ext);