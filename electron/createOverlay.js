const {
    BrowserWindow
} = require("electron");

const path = require("path");

function createOverlay({
    app
} = {}) {

    const overlay =
        new BrowserWindow({

            width: 320,

            height: 180,

            frame: false,

            transparent: true,

            alwaysOnTop: false,

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
    overlay.setVisibleOnAllWorkspaces(
        true
    );

    overlay.setFullScreenable(
        false
    );

    overlay.on(
        "close",
        (event) => {

            if (
                app?.isQuitting
            ) {

                return;

            }

            event.preventDefault();
            overlay.hide();

        }
    );

    overlay.once(
        "ready-to-show",
        () => {

            overlay.hide();

        }
    );

    return overlay;
}

module.exports = createOverlay;
