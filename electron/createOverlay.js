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
                    true,

                autoplayPolicy:
                    "no-user-gesture-required"

            }

        });

    // Use process.env.NODE_ENV to determine if dev or production
    const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;
    const overlayUrl = isDev
        ? "http://localhost:5174/overlay"
        : `file://${path.join(__dirname, "..", "client", "dist", "index.html")}#/overlay`;

    overlay.loadURL(overlayUrl);
    
    if (isDev) {
        overlay.webContents.openDevTools();
    }
    
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