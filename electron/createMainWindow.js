const {
    BrowserWindow
} = require("electron");

const path = require("path");

function createMainWindow() {

    const win =
        new BrowserWindow({

            width: 1400,

            height: 900,

            webPreferences: {

                preload:
                    path.join(
                        __dirname,
                        "preload.js"
                    ),

                nodeIntegration:
                    false,

                contextIsolation:
                    true,

                sandbox:
                    true

            }

        });

    win.loadURL(
        "http://localhost:5174"
    );

    return win;
}

module.exports =
    createMainWindow;
