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

// Set development environment if --dev flag is passed
if (process.argv.includes("--dev")) {
    process.env.NODE_ENV = "development";
}

let mainWindow;
const overlayState = {
    window: null,
    ready: false,
    pendingCheckIn: null
};

function isMainWindowForeground() {
    return Boolean(
        mainWindow &&
        !mainWindow.isDestroyed() &&
        mainWindow.isVisible() &&
        mainWindow.isFocused()
    );
}

function clearOverlayState() {
    overlayState.ready = false;
    overlayState.pendingCheckIn = null;
    overlayState.window = null;
}

function ensureOverlayWindow() {
    if (
        overlayState.window &&
        !overlayState.window.isDestroyed()
    ) {
        return overlayState.window;
    }

    overlayState.window = createOverlay({
        app
    });

    overlayState.window.on(
        "closed",
        () => {
            if (
                overlayState.window &&
                overlayState.window.isDestroyed()
            ) {
                clearOverlayState();
            }
        }
    );

    overlayState.ready = false;
    overlayState.pendingCheckIn = null;

    return overlayState.window;
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

    ensureOverlayWindow();

    registerOverlayIPC({
        ipcMain,
        overlayState,
        ensureOverlayWindow,
        mainWindow: () => mainWindow
    });

    registerFocusIPC({
        ipcMain,
        BrowserWindow
    });

    registerPermissionsIPC({
        ipcMain,
        systemPreferences,
        overlayWindow: overlayState.window
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
