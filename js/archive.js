(function (global) {
    console.log('dialog-arhive');
    var dialogs = flm.ui.getDialogs();
    var diagId = dialogs.getDialogId('window');
    var settings = flm.getConfig().archives;

    var archiveType = $("#fMan_archtype");
    var compression = $("#fMan_archcompr");
    var password = $("#fMan_apassword");
    var volumeSize = $("#fMan_vsize");

    var compressExtMap  = {
        'gzip': 'tar.gz',
        'bzip2': 'tar.bz2'
    };

    dialogs.onStart(function () {


        return flm.manager.doArchive(
            dialogs.getTargetPath(diagId),
            dialogs.getCheckedList(diagId),
            {
                type: archiveType.val(),
                compression: compression.val(),
                password: password.val(),
                volumeSize: volumeSize.val()
            }
        );

    });


    var updateArchiveName = function () {

        var type, ext;
        type
            = ext
            = archiveType.val().toLowerCase();
        var level = settings[type].compression[ compression.val()];

        if(type === 'tar')
        {
            ext = compressExtMap.hasOwnProperty(level) ? compressExtMap[level] : ext;
        }

        var file  = dialogs.getTargetPath(diagId);

        var archives = Object.keys(settings);
        archives = $.uniqueSort(archives.concat(Object.values(compressExtMap)));

        file = flm.utils.buildPath([
            flm.utils.basedir(file),
            flm.utils.stripFileExtension(file, archives)
        ]);

        file = flm.utils.trimslashes(file) === "" || flm.utils.trimslashes(file) === flm.utils.trimslashes(flm.getCurrentPath())
            ? flm.ui.browser.getSelectedEntry()
            : file;
        var fileName = file+ '.' + ext;

        dialogs.updateTargetPath(diagId, fileName);
    };

    var updateCompression = function () {

        var type  = archiveType.val().toLowerCase();

        updateArchiveName();

        var notRar = (type !== 'rar');
        $("#fMan_vsize").attr("disabled", (!$("#fMan_multiv").attr("disabled", notRar).is(':checked') || notRar));
        $('#fMan_apassword').attr("disabled", notRar);

        compression.empty();
        for (var i = 0; i < settings[type].compression.length; i++) {
            compression.append('<option value="' + i + '">' + theUILang.fManArComp[type][i] + '</option>');
        }
    };

    if(!archiveType.find('option').length)
    {
        for (var type in settings) {
            archiveType.append('<option value="' + type + '">' + type.toUpperCase() + '</option>');
        }
    }

    $("#fMan_multiv").change(function () {
        var dis = $(this).is(':checked');
        volumeSize.attr("disabled", !dis);
    });

    archiveType.change(function () {
        updateCompression()
    });

    compression.change(function () {
        updateArchiveName();
    });

    updateCompression();

})
(window);
