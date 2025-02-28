export function FileManagerUtils(flm) {
    let fileType;
    let utils = {
        perm_map: ['-', '-xx', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']
    };

    utils.extTypes = {
        text: (ext) => utils.isTextfile(ext)
    };

    utils.fileMatches = (file, pattern) => {
        let re = new RegExp(pattern + '$', "i");
        return utils.basename(file).match(re);
    }

    utils.isTextfile = (extension) => {
        return utils.fileMatches(extension, flm.config.extensions.text);
    };

    utils.isDir = function (element) {
        return (element.charAt(element.length - 1) === '/');
    };

    utils.logSystem = function (component) {
        let logMsg = '';

        component = component || 'filemanager';

        for (let i = 1; i < arguments.length; i++) {
            logMsg += arguments[i];
        }
        log(component + ': ' + logMsg);
    };

    utils.logError = function (errcode, extra, component) {

        if (!$type(extra)) {
            extra = '';
        }

        // take 0 as valid error code
        if ($type(errcode)) {
            let codeMsg = $type(theUILang.fErrMsg[errcode])
                ? theUILang.fErrMsg[errcode]
                : errcode;

            flm.utils.logSystem(component, codeMsg, " -> ", extra);
        }

    };

    utils.formatPermissions = function (octal) {

        var map = this.perm_map;
        var arr = octal.split('');

        var out = '';

        for (var i = 0; i < arr.length; i++) {
            out += map[arr[i]];
        }
        return out;

    };

    utils.formatDate = function (timestamp, format) {

        if (timestamp) {

            var d = new Date(timestamp * 1000);

            var times = {
                s: d.getSeconds(),
                m: d.getMinutes(),
                h: d.getHours(),

                d: d.getDate(),
                M: d.getMonth(),
                y: d.getFullYear()
            };

            for (let i in times) {
                if (i === 'M') {
                    times[i]++;
                }
                if (times[i] < 10) {
                    times[i] = "0" + times[i];
                }
            }

            return format.replace(/%([dMyhms])/g, function (m0, m1) {
                return times[m1];
            });
        } else {
            return '';
        }
    };

    utils.hasDir = function (entries) {
        var hasDirs = false;
        $.each(entries, function (k, v) {
            if (window.flm.utils.isDir(v)) {
                hasDirs = true;
                return false;

            }

        });

        return hasDirs;
    };

    utils.getFileTypeByExtension = (extension) => {
        let sorted = Object.keys(utils.extTypes)
            .sort()
            .reduce((Obj, key) => {
                Obj[key] = utils.extTypes[key];
                return Obj;
            }, {});

        for (let i in sorted) {
            if (utils.extTypes[i](extension)) {
                return i;
            }
        }

        return false;
    };

    utils.getICO = function (element) {

        if (this.isDir(element)) {
            return ('Icon_Dir');
        }

        var iko = 'flm-sprite ';
        const ext = this.getExt(element).toLowerCase();
        switch (ext) {
            case 'torrent':
                iko += 'sprite-torrent';
                break;
            default:
                fileType = utils.getFileTypeByExtension(ext);

                if (fileType) {
                    iko += `flm-icon-${fileType} flm-icon-${ext}`;
                } else {
                    iko = `Icon_File`;
                }
        }

        return iko;
    };

    utils.getExt = function (element) {

        if (!$type(element)) {
            return '';
        }

        var ext = element.split('.').pop();
        var valid = (element.split('.').length > 1) && ext.match(/^[A-Za-z0-9]{2,50}$/);

        ext = valid ? ext : '';

        return ext.toLowerCase();
    };

    utils.basedir = function (path) {

        var last = '';
        path = this.trimslashes(path);

        if (path) {
            var ar = path.split('/');
            ar.pop();
            last += ar.join('/');
            if (ar.length > 0) {
                last += '/';
            }
        }

        return '/' + last;
    };

    utils.stripBasePath = function (path, basepath) {
        const normalizedBase = basepath.endsWith("/") ? basepath : basepath + "/";
        let strippedPath = path.startsWith(normalizedBase)
            ? path.slice(normalizedBase.length)
            : path;
        // Ensure the result starts with a slash
        if (!strippedPath.startsWith("/")) {
            strippedPath = "/" + strippedPath;
        }
        return strippedPath;
    };


    utils.json_encode = function (obj) {
        var self = this;
        var s = '';
        switch ($type(obj)) {
            case "number":
                return (String(obj));
            case "boolean":
                return (obj ? "1" : "0");
            case "string":
                return ('"' + obj + '"');
            case "array": {
                s = '';
                $.each(obj, function (key, item) {
                    if (s.length)
                        s += ",";
                    s += self.json_encode(item);
                });
                return ("[" + s + "]");
            }
            case "object": {
                s = '';
                $.each(obj, function (key, item) {
                    if (s.length)
                        s += ",";
                    s += ('"' + key + '":' + self.json_encode(item));
                });
                return ("{" + s + "}");
            }
        }
        return ("null");
    };

    utils.rtrim = function (str, char) {
        if (!$type(str)) {
            return str;
        }
        // handles one char
        char = char && char[0] || ' ';

        var lastIndexOfChar = 0;

        for (var i = str.length - 1; i >= 0; i--) {
            if (str[i] === char) {
                lastIndexOfChar = i;
            } else {
                break;
            }
        }

        return lastIndexOfChar ? str.slice(0, lastIndexOfChar)
            : str;
    };

    utils.ltrim = function (str, char) {
        if (!$type(str)) {
            return str;
        }
        // handles one char
        char = char && char[0] || ' ';

        var lastIndexOfChar = 0;

        for (var i = 0; i < str.length; i++) {
            if (str[i] === char) {
                lastIndexOfChar = i + 1;
            } else {
                break;
            }
        }

        return str.slice(lastIndexOfChar)

    };

    utils.addslashes = function (str) {
        // http://phpjs.org/functions/addslashes:303
        return (str + '').replace(/[\\"\/]/g, '\\$&').replace(/\u0000/g, '\\0');
    };

    utils.isValidPath = function (what) {
        what = what || '';
        return what.includes('/');
    }

    utils.basename = function (what) {
        return utils.trimslashes(what).split('/').pop();
    };

    utils.replaceFilePath = function (newPath, oldPath, ext, forceExtension = false) {
        let fileDir = this.basedir(newPath);
        let fileName = this.basename(newPath);
        const exts = $type(ext) === 'array' ? ext.join("|") : ext;

        if (this.isDir(newPath) && oldPath) {
            fileDir = newPath;
            fileName = this.isDir(oldPath)
                ? flm.ui.filenav.recommendedFileName(exts, forceExtension)
                : this.basename(oldPath);
        } else if (this.isDir(newPath)) {
            fileName = flm.ui.filenav.recommendedFileName(exts, forceExtension);
        }

        fileName = ext
            ? this.stripFileExtension(fileName, exts) + (forceExtension ? '.' + forceExtension : '')
            : fileName;

        return this.buildPath([fileDir, fileName]);
    };

    utils.buildPath = function (parts) {

        var res = [];
        var item;
        var endingSlash = false;
        for (var i = 0; i < parts.length; i++) {
            item = parts[i];
            item = utils.trimslashes(item);
            if (item !== "") {
                endingSlash = utils.isDir(parts[i]);
                res.push(item);
            }
        }
        var ret = '/' + res.join('/');
        if (endingSlash) {
            ret += '/';
        }
        return ret;

    };
    utils.trimslashes = function (str) {

        if (!$type(str)) {
            return '';
        }

        var ar = str.split('/');
        var rar = [];

        for (var i = 0; i < ar.length; i++) {
            if (ar[i]) {
                rar.push(ar[i]);
            }
        }

        return (rar.join('/'));
    }

    utils.setValidation = (field) => {
        field.on("input", () => {
            field[0].setCustomValidity("");
            field[0].checkValidity();
        })
    };

    utils.stripFileExtension = function (currentPath, exts) {
        var file;
        var fileName = flm.utils.basename(currentPath);

        if ($type(exts)) {
            // debugger;
            file = fileName.replace(new RegExp('\.(' + exts + ')$', "i"), "");
        } else {
            var parts = fileName.split('.');
            parts.pop();
            file = parts.join('.');
        }

        return file;
    }

    return utils;
}