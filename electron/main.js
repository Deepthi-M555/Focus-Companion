const {
    app,
    ipcMain,
    BrowserWindow,
    systemPreferences
} = require("electron");

const createMainWindow =
    require("./createMainWindow");

const createOverlay =
    require("./createOverlay");

const registerOverlayIPC =
    require("./ipc/overlayIPC");

const registerFocusIPC =
    require("./ipc/focusIPC");

const registerPermissionsIPC =
    require("./ipc/permissionsIPC");

const registerNotificationIPC =
    require("./ipc/notificationIPC");

let mainWindow;
let overlayWindow;

function ensureOverlayWindow() {
    if (
        overlayWindow &&
        !overlayWindow.isDestroyed()
    ) {
        return overlayWindow;
    }

    overlayWindow = createOverlay({
        app
    });

    return overlayWindow;
}

function createTrackedMainWindow() {

    const window =
        createMainWindow();

    window.on(
        "closed",
        () => {

            mainWindow = null;

            if (
                process.platform !== "darwin"
            ) {

                app.quit();

            }

        }
    );

    return window;
}

app.on(
    "before-quit",
    () => {

        app.isQuitting = true;

    }
);

app.whenReady().then(() => {

    mainWindow =
        createTrackedMainWindow();

    overlayWindow =
        ensureOverlayWindow();

    registerOverlayIPC({
        ipcMain,
        overlayWindow
    });

    registerFocusIPC({
        ipcMain,
        BrowserWindow
    });

    registerPermissionsIPC({
        ipcMain,
        systemPreferences,
        overlayWindow
    });

    registerNotificationIPC({
        ipcMain
    });

});

app.on(
    "window-all-closed",
    () => {

        if (
            process.platform !== "darwin"
        ) {

            app.isQuitting = true;
            app.quit();

        }

    }
);

app.on(
    "activate",
    () => {

        if (
            !mainWindow ||
            mainWindow.isDestroyed()
        ) {

            mainWindow =
                createTrackedMainWindow();

        }

    }
);
