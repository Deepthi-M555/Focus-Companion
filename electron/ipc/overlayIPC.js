function registerOverlayIPC({
    ipcMain,
    overlayState,
    ensureOverlayWindow,
    mainWindow
}) {

    const getOverlayWindow = () => {
        const overlay = overlayState.window;

        if (!overlay || overlay.isDestroyed()) {
            return null;
        }

        return overlay;
    };

    const deliverPendingCheckIn = () => {
        const overlay = getOverlayWindow();

        if (!overlay || overlay.isDestroyed()) {
            return false;
        }

        if (!overlayState.ready || !overlayState.pendingCheckIn) {
            return false;
        }

        overlay.show();
        overlay.webContents.send(
            "check-in-required",
            overlayState.pendingCheckIn
        );
        overlayState.pendingCheckIn = null;

        return true;
    };

    ipcMain.on(
        "overlay:renderer-ready",
        () => {
            const overlay = getOverlayWindow();

            if (!overlay || overlay.isDestroyed()) {
                overlayState.ready = false;
                return;
            }

            overlayState.ready = true;
            deliverPendingCheckIn();
        }
    );

    ipcMain.handle(
        "show-overlay",
        async (_, data) => {
            try {
                const activeMainWindow = typeof mainWindow === "function" ? mainWindow() : null;
                const shouldStayInApp = Boolean(
                    activeMainWindow &&
                    !activeMainWindow.isDestroyed() &&
                    activeMainWindow.isVisible() &&
                    activeMainWindow.isFocused()
                );

                if (shouldStayInApp) {
                    return {
                        success: true,
                        overlayShown: false,
                        inApp: true,
                        visible: false,
                        ready: false
                    };
                }

                const overlay = ensureOverlayWindow();

                if (!overlay || overlay.isDestroyed()) {
                    return {
                        success: false,
                        error: "Overlay window unavailable"
                    };
                }

                if (data && typeof data === "object") {
                    overlayState.pendingCheckIn = data;
                }

                overlay.show();
                overlay.focus();
                overlay.setAlwaysOnTop(true, "floating");

                if (!overlayState.ready) {
                    return {
                        success: true,
                        overlayShown: true,
                        queued: true,
                        visible: overlay.isVisible(),
                        ready: false
                    };
                }

                const delivered = deliverPendingCheckIn();

                return {
                    success: true,
                    overlayShown: true,
                    queued: !delivered,
                    visible: overlay.isVisible(),
                    ready: overlayState.ready
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message || "Unable to show overlay"
                };
            }
        }
    );

    ipcMain.handle(
        "hide-overlay",
        async () => {
            try {
                const overlay = getOverlayWindow();

                if (!overlay || overlay.isDestroyed()) {
                    return {
                        success: false,
                        error: "Overlay window unavailable"
                    };
                }

                overlay.hide();
                overlay.setAlwaysOnTop(false);
                overlayState.ready = false;

                return {
                    success: true,
                    visible: overlay.isVisible()
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message || "Unable to hide overlay"
                };
            }
        }
    );

    ipcMain.handle(
        "overlay:get-status",
        async () => {
            try {
                const overlay = getOverlayWindow();

                if (!overlay || overlay.isDestroyed()) {
                    return {
                        success: false,
                        error: "Overlay window unavailable"
                    };
                }

                return {
                    success: true,
                    visible: overlay.isVisible(),
                    alwaysOnTop: overlay.isAlwaysOnTop(),
                    ready: overlayState.ready
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message || "Unable to read overlay status"
                };
            }
        }
    );

}

module.exports = registerOverlayIPC;
