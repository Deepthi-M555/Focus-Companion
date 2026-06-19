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
        async () => {

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

            return {
                success: true
            };

        }
    );

    ipcMain.handle(
        "hide-overlay",
        async () => {

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
                success: true
            };

        }
    );

}

module.exports = registerOverlayIPC;