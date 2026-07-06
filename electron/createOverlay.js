const {
    BrowserWindow
} = require("electron");

const path = require("path");

function createOverlay() {

    const overlay =
        new BrowserWindow({

            width: 320,

            height: 180,

            frame: false,

            transparent: true,

            alwaysOnTop: true,

            skipTaskbar: true,

            resizable: false,

            show: false,

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

    overlay.loadURL(
        "http://localhost:5174/overlay"
    );

    return overlay;
}

module.exports = createOverlay;
