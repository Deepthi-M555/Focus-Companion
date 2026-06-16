const {
    app,
    ipcMain
} = require("electron");

const createMainWindow =
    require("./createMainWindow");

const createOverlay =
    require("./createOverlay");

let mainWindow;

let overlayWindow;

app.whenReady().then(() => {

    mainWindow =
        createMainWindow();

    overlayWindow =
        createOverlay();

});

/*
    Overlay Controls
*/

ipcMain.on(
    "show-overlay",

    () => {

        overlayWindow.show();

    }
);

ipcMain.on(
    "hide-overlay",

    () => {

        overlayWindow.hide();

    }
);

/*
    Focus Controls
*/

ipcMain.on(
    "focus-mode",

    () => {

        console.log(
            "Focus Mode Started"
        );

    }
);

ipcMain.on(
    "pause-session",

    () => {

        console.log(
            "Session Paused"
        );

    }
);

ipcMain.on(
    "complete-session",

    () => {

        console.log(
            "Session Completed"
        );

    }
);

app.on(
    "window-all-closed",

    () => {

        app.quit();

    }
);