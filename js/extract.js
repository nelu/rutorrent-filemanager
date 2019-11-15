(function (global) {
    console.log('doing extract')
    var dialogs = flm.ui.getDialogs();
    var diagId = dialogs.getDialogId('extract');



    // api method
    flm.api.extractArchive = function(archive, toDir) {

        return flm.api.post({
            method: 'fileExtract',
            target: archive,
            to: toDir
        });
    };


    // service
    flm.manager.doExtract = function(archive, toDir) {

        if (!flm.utils.isValidPath(dirname)) {
            alert(theUILang.fDiagInvalidname);
            return;
        }

        return flm.api.post({
            method: 'fileExtract',
            target: archive,
            to: toDir
        });
    };

    // form submit
    dialogs.onStart(function () {
        dirname = flm.utils.buildPath([currentPath, dirname]);

        var destination = dialogs.getTargetPath(diagId);

        return flm.manager.doExtract(dirname);
    });

})
(window);