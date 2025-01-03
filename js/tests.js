if (typeof FileManagerTests === 'undefined') {
    let FileManagerTests, DeleteTests, NewDirTests;
}

DeleteTests = function () {
    let dialogs = flm.ui.getDialogs();
    let diagId;

    let self = this;

    self.testOpenDialog = function () {
        let def = $.Deferred();

        // invalid paths
        dialogs.showDialog('delete', {
            afterShow: (diagId) => {
                console.log("DeleteTests.testOpenDialog OK: " + diagId);
                def.resolve(diagId);
                return diagId;
            }
        });

        return def.promise();
    }

    self.testCloseDialog = function (diagId, timeout = 2000) {
        let def = $.Deferred();

        setTimeout(() => {
            dialogs.hide(diagId, () => {
                console.log("DeleteTests.testCloseDialog: closed dialog " + diagId)
                def.resolve(diagId);
            });
        }, timeout);

        return def.promise();
    }

    self.testDeleteExisting = function (file) {
        let def = $.Deferred();

        flm.ui.filenav.selectedEntries = [file, '/TestFolder2/'];

        self.testOpenDialog().then((diagId) => {
            console.log("DeleteTests.testDeleteExisting: dialog open " + diagId)
            dialogs.startButton(diagId).click();

            return dialogs.startedPromise.then(function (result) {
                console.log("DeleteTests.testDeleteExisting: done", result)
                //def.resolve(diagId);
                setTimeout(() => {
                    $("#tskBackground").click();
                    def.resolve(result);
                }, 2000);
                return result;
            });
        });

        return def.promise();
    }

    self.runTests = function (testDirname) {

        return $.when(self.testOpenDialog())
            .then((dId) => {
                    return dId;
                },
                (error) => {
                    console.log("DeleteTests.runTests.testOpenDialog ERROR:", error);
                    return error;
                })

            .then((dId) => {
                console.log("DeleteTests.runTests.testCloseDialog closing diag: " + dId);
                return self.testCloseDialog(dId, 2000);
            })
            .then((dId) => {
                console.log("DeleteTests.runTests.testDeleteExisting: " + testDirname);
                return self.testDeleteExisting(testDirname, 2000);
            });

    }

    return self;
}


NewDirTests = function () {
    let self = this;
    let dialogs = flm.ui.getDialogs();
    let diagId;

    self.testCloseDialog = function (diagId, timeout = 2000) {
        let def = $.Deferred();

        setTimeout(() => {
            dialogs.hide(diagId, () => {
                console.log("NewDirTests.testCloseDialog: closed dialog " + diagId)
                def.resolve(diagId);
            });
        }, timeout);

        return def.promise();
    }

    self.testCreateNewDirectory = function (diagId, dirname) {
        let def = $.Deferred();
        //let promise = DeleteTests().testDeleteExisting(dirname);

        DeleteTests().testDeleteExisting(dirname).then((result) => {
            console.log("NewDirTests.testCreateNewDirectory: open dialog ", result);
            //                 return self.testOpenDialog();
            // calling from will change the scope to DeleteTests
            // opens the delete dialog window
            // so a different method name works
            // like self.openDiag
            return self.openDiag();
        })
            .then((diagId) => {
                console.log("NewDirTests.testCreateNewDirectory creating dir: ", diagId);
                dialogs.updateTargetPath('#' + diagId, dirname);


                // let see the dialog for 2 seconds
                setTimeout(() => {
                    dialogs.startButton(diagId).click();
                    // start
                    //console.log(diagId, flm.ui.getDialogs().startButton('#'+diagId), '#'+diagId);

                    dialogs.startedPromise.then((result) => {
                        def.resolve(result);
                        return result;
                    });
                }, 2000);

                return diagId;
            });

        return def.promise();
    };

    self.openDiag = function () {
        let def = $.Deferred();

        // invalid paths
        dialogs.showDialog('mkdir', {
            afterShow: (id) => {
                diagId = id;
                console.log("NewDirTests.testOpenDialog ok", diagId);
                def.resolve(id);
            }
        });

        return def.promise();
    }


    self.runTests = function (dirname) {
        return $.when(self.openDiag()).then(
            (dId) => {
                console.log("NewDirTests.runTests.testCloseDialog: " + dId);
                return self.testCloseDialog(dId, 4000);
            },
            (error) => {
                console.log("NewDirTests.runTests.testOpenDialog error: ", error);
            })
            .then((dialogId) => {
                console.log("NewDirTests.runTests.testCreateNewDirectory: ", dialogId, dirname);
                return self.testCreateNewDirectory(dialogId, dirname);
            });

    }

    return this;
}

FileManagerTests = function () {
    const testDirname = "TestFolder";

    DeleteTests().runTests(testDirname).then(function (results) {
        console.log("FileManagerTests: DeleteTests Done", results);
    }).then(() => {
        return NewDirTests().runTests(testDirname).then(function (results) {
            console.log("FileManagerTests: NewDirTests Done", results);
        });
    });

    // NewDirTests().runTests();

    return true;
}


// FileManagerTests();

//
// delete tests: injectScript('/plugins/filemanager/js/tests.js', () => DeleteTests().runTests('TestDir'));
// all tests: injectScript('/plugins/filemanager/js/tests.js', () => FileManagerTests());