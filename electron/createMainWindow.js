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
                    true,

                autoplayPolicy:
                    "no-user-gesture-required"

            }

        });

    // Use process.env.NODE_ENV to determine if dev or production
    const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;
    const startUrl = isDev
        ? "http://localhost:5174"
        : `file://${path.join(__dirname, "..", "client", "dist", "index.html")}`;

    win.loadURL(startUrl);

    if (isDev) {
        win.webContents.openDevTools();
    }

    return win;
}

module.exports =
    createMainWindow;
