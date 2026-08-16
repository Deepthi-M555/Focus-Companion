function registerOverlayIPC({
    ipcMain,
    overlayWindow,
    mainWindow
}) {

    let pendingCheckIn = null;
    let overlayRendererReady = false;

    const isOverlayAvailable =
        () =>
            overlayWindow &&
            !overlayWindow.isDestroyed();

    const shouldUseInAppCheckIn =
        () => {

            if (
                !mainWindow ||
                mainWindow.isDestroyed()
            ) {
                return false;
            }

            const appIsForeground =
                mainWindow.isVisible() &&
                mainWindow.isFocused() &&
                !mainWindow.isMinimized();

            return appIsForeground;
        };

    const sendPendingCheckIn = () => {

        if (
            pendingCheckIn &&
            isOverlayAvailable() &&
            overlayRendererReady
        ) {
            console.log("[OVERLAY TTS] dispatching check-in payload", pendingCheckIn);
            overlayWindow.webContents.send(
                "check-in-required",
                pendingCheckIn
            );
            pendingCheckIn = null;
        }

    };

    ipcMain.on(
        "overlay:renderer-ready",
        () => {

            overlayRendererReady = true;
            sendPendingCheckIn();

        }
    );

    ipcMain.handle(
        "show-overlay",
        async (_, data) => {

            try {

            if (
                !isOverlayAvailable()
            ) {

                return {
                    success: false,
                    error:
                        "Overlay window unavailable"
                };

            }

            if (
                shouldUseInAppCheckIn()
            ) {
                overlayWindow.hide();
                pendingCheckIn = null;
                return {
                    success: true,
                    visible: false,
                    inApp: true,
                    overlayShown: false
                };
            }

            // The overlay BrowserWindow stays alive between check-ins. Its
            // renderer sends overlay:renderer-ready once when it mounts.
            // Do NOT reset readiness here, otherwise every later check-in
            // gets stuck in pending state until the overlay is reloaded.
            pendingCheckIn = data || null;
            overlayWindow.show();
            sendPendingCheckIn();

            return {
                success: true,
                visible: overlayWindow.isVisible(),
                inApp: false,
                overlayShown: overlayWindow.isVisible()
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

            if (
                !isOverlayAvailable()
            ) {

                overlayRendererReady = false;
                pendingCheckIn = null;

                return {
                    success: true,
                    visible: false,
                    message: "Overlay already hidden or destroyed"
                };

            }

            overlayWindow.hide();
            pendingCheckIn = null;

            return {
                success: true,
                visible: overlayWindow.isVisible()
            };

            } catch (error) {

                overlayRendererReady = false;
                pendingCheckIn = null;

                return {
                    success: true,
                    visible: false,
                    message: "Hide operation completed"
                };

            }

        }
    );

    ipcMain.handle(
        "overlay:get-status",
        async () => {

            try {

                if (
                    !isOverlayAvailable()
                ) {

                    return {
                        success: false,
                        error: "Overlay window unavailable"
                    };

                }

                return {
                    success: true,
                    visible: overlayWindow.isVisible(),
                    alwaysOnTop: overlayWindow.isAlwaysOnTop()
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