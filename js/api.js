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
                data: {action: flm.utils.json_encode(data)}, // encoded rest
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

        theWebUI.startConsoleTask(name, plugin_name, data, {noclose: true});
        let runTask = theWebUI.getConsoleTask();

        var handleTask = function (e, task) {
            if (task.no === runTask.no) {
                // our task
                if (task.hasOwnProperty('errcode') && task.errors === 0) {
                    // log to system
                    //flm.utils.logSystem(task.errcode, " -> ", task.msg);
                    //task.status = false;
                    def.reject(task);

                    task.status = 1;
                    task.errors = [($type(theUILang.fErrMsg[task.errcode])
                        ? theUILang.fErrMsg[task.errcode] + " -> " + task.msg
                        : task.msg)];
                    delete task.errcode;
                    // log the request error as task errors
                    thePlugins.get("_task").check(task);
                } else if (!task.hasOwnProperty('errcode')) {
                    def.resolve(task);
                }
            }
        };

        flm.onEvent('taskDone', handleTask, true);
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
