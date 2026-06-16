const {
    BrowserWindow
} = require("electron");

const path = require("path");

const createOverlay = require("./createOverlay");

function createWindow() {

    const win = new BrowserWindow({

        width: 1400,

        height: 900,

        webPreferences: {

            preload: path.join(
                __dirname,
                "preload.js"
            ),

            nodeIntegration: false,

            contextIsolation: true,

            sandbox: true

        }

    });

    win.loadURL(
        "http://localhost:5173"
    );

    return win;
}

module.exports = createWindow;