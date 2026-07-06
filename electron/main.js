const {
    app,
    ipcMain,
    BrowserWindow
} = require("electron");

const createMainWindow =
    require("./createMainWindow");

const createOverlay =
    require("./createOverlay");

const registerOverlayIPC =
    require("./ipc/overlayIPC");

const registerFocusIPC =
    require("./ipc/focusIPC");

let mainWindow;
let overlayWindow;

app.whenReady().then(() => {

    mainWindow =
        createMainWindow();

    overlayWindow =
        createOverlay();

    registerOverlayIPC({
        ipcMain,
        overlayWindow
    });

    registerFocusIPC({
        ipcMain,
        BrowserWindow
    });

});

app.on(
    "window-all-closed",
    () => {

        if (
            process.platform !== "darwin"
        ) {

            app.quit();

        }

    }
);

app.on(
    "activate",
    () => {

        if (
            BrowserWindow.getAllWindows()
                .length === 0
        ) {

            mainWindow =
                createMainWindow();

        }

    }
);