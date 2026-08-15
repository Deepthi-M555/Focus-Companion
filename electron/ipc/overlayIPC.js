function registerOverlayIPC({
    ipcMain,
    overlayWindow
}) {

    const isOverlayAvailable =
        () =>
            overlayWindow &&
            !overlayWindow.isDestroyed();

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

            overlayWindow.show();
            if (data) {
                overlayWindow.webContents.send(
                    "check-in-required",
                    data
                );
            }
            return {
                success: true,
                visible: overlayWindow.isVisible()
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

                return {
                    success: false,
                    error:
                        "Overlay window unavailable"
                };

            }

            overlayWindow.hide();

            return {
                success: true,
                visible: overlayWindow.isVisible()
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
