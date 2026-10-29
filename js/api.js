export function apiClient(endpoint) {

    let client = {
        endpoint: endpoint,

        get: function (data) {
            return this.request('GET', data);
        },
        post: function (data) {
            return this.request('POST', data);
        },
        request: function (type, data) {
            type = type || 'GET';

            var deferred = $.Deferred();

            $.ajax({
                type: type,
                url: endpoint + '?_=' + Math.floor(Date.now() / 1000),
                timeout: theWebUI.settings["webui.reqtimeout"],
                async: true,
                cache: false,
                data: {action: JSON.stringify(data)}, // encoded rest
                //  contentType: "application/json",
                dataType: "json",

                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    deferred.reject({'response': [XMLHttpRequest, textStatus, errorThrown]});
                },
                success: function (data) {
                    if (data.hasOwnProperty('errcode')
                        || (data.hasOwnProperty('error') && data.error)) {

                        deferred.reject(data);

                    } else {
                        deferred.resolve(data);
                    }
                }
            });

            return deferred.promise();
        }
    };

    client.runTask = function (name, data, plugin_name) {
        var def = $.Deferred();

        plugin_name = plugin_name || flm.getPlugin().name;
        data.workdir = flm.getCurrentPath();

        flm.EVENTS.taskStarted.on((event, ranTask) => {
            // background task reference
            const startedTask = JSON.parse(JSON.stringify(ranTask));

            // override task error fields from filemanager api error response
            if (ranTask.hasOwnProperty('errcode') && ranTask.errors === 0) {
                // format error log
                ranTask.errors = [($type(theUILang.fErrMsg[ranTask.errcode])
                    ? theUILang.fErrMsg[ranTask.errcode] + " -> " + ranTask.msg
                    : ranTask.msg)
                ];

                def.reject(ranTask);

                // log the request error as task errors
                setTimeout(() => {
                    delete ranTask.errcode;
                    ranTask.status = 1;
                    thePlugins.get("_task").check(ranTask);
                });
            } else {
                flm.EVENTS.taskDone.on((e, finishedTask)=> {
                    if (finishedTask.no === startedTask.no) {
                        !finishedTask.hasOwnProperty('errcode')
                        && def.resolve(finishedTask);
                    } else {
                        console.warn('got untracked task?', finishedTask,
                            "startedTask", ranTask,
                            'startedTask clone', startedTask);
                    }
                }, true);
            }
        }, true);

        theWebUI.startConsoleTask(name, plugin_name, data, {noclose: true});

        return def.promise();
    };

    client.copy = function (files, to) {
        return this.runTask("copy", {
            method: 'filesCopy',
            to: to,
            fls: files
        });

    };

    client.move = function (files, to) {
        return this.runTask("move", {
            method: 'filesMove',
            to: to,
            fls: files
        });
    };

    client.removeFiles = function (paths) {
        return this.runTask("remove", {
            method: 'filesRemove',
            fls: paths
        });

    };

    client.getDir = function (dir) {
        return client.post({
            'method': 'listDirectory',
            'dir': dir
        });
    };

    client.getNfo = function (file, mode) {

        return client.post({
            method: 'viewNfo',
            target: file,
            mode: mode
        });

    };

    client.mkDir = function (dir) {

        return client.post({
            method: 'newDirectory',
            target: dir
        });

    };

    client.rename = function (source, destination) {

        return client.post({
            method: 'fileRename',
            target: source,
            to: destination
        });

    };

    return client;

}
