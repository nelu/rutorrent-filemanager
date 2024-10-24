export function FileManagerActions () {
    let self = this;

    self.inaction = false;
    self.notification = null;

    self.cleanactions = () => {

        $(".fMan_Stop").attr('disabled', true);
        flm.ui.console.hideProgress();
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
    };

    self.logAction = (action, text) => {
        flm.ui.console.show(action + ': ' + text);
    }

    self.logConsole = (action, text) => {
        flm.ui.console.logMsg(action + ': ' + text);
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

    self.notify = (contents, color = 'information', hideAfter= 5000) => {
        self.notification = $.noty(
            {
                text: contents,
                layout: 'bottomLeft',
                type: color,
                timeout: hideAfter,
                closeOnSelfClick: true
            });

//            flm.actions.logConsole('rename', source + ' -> ' + destination);

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
