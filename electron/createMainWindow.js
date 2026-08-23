const {
    BrowserWindow,
    session
} = require("electron");

const path = require("path");

function applyProductionCSP() {
    session.defaultSession.webRequest.onHeadersReceived(
        (details, callback) => {

            const csp =
                "default-src 'self'; " +
                "script-src 'self'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: blob: https://images.unsplash.com; " +
                "font-src 'self' data:; " +
                "media-src 'self' blob:; " +
                "connect-src 'self' https://fynix-server.onrender.com wss://fynix-server.onrender.com http://127.0.0.1:8001 ws://127.0.0.1:8001; "
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "frame-ancestors 'none';";

            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    "Content-Security-Policy": [csp]
                }
            });
        }
    );
}

function createMainWindow() {

    const isDev =
        process.env.NODE_ENV === "development" ||
        process.env.ELECTRON_START_URL;

    if (!isDev) {
        applyProductionCSP();
    }

    const win =
        new BrowserWindow({

            width: 1400,

            height: 900,

            icon: path.join(
                __dirname,
                "../assets/icon.png"
            ),

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

    const startUrl = isDev
        ? "http://localhost:5174"
        : `file://${path.join(
            __dirname,
            "..",
            "client",
            "dist",
            "index.html"
        )}`;

    win.loadURL(startUrl);

    if (isDev) {
        win.webContents.openDevTools();
    }

    return win;
}

module.exports =
    createMainWindow;