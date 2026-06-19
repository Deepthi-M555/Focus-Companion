function registerFocusIPC({
    ipcMain
}) {

    ipcMain.handle(
        "start-focus-session",
        async () => {

            try {

                console.log(
                    "Focus Started"
                );

                return {
                    success: true,
                    state: "ACTIVE"
                };

            } catch (error) {

                return {
                    success: false,
                    error:
                        error.message
                };

            }

        }
    );

    ipcMain.handle(
        "pause-focus-session",
        async () => {

            try {

                console.log(
                    "Focus Paused"
                );

                return {
                    success: true,
                    state: "PAUSED"
                };

            } catch (error) {

                return {
                    success: false,
                    error:
                        error.message
                };

            }

        }
    );

    ipcMain.handle(
        "complete-focus-session",
        async () => {

            try {

                console.log(
                    "Focus Completed"
                );

                return {
                    success: true,
                    state: "COMPLETED"
                };

            } catch (error) {

                return {
                    success: false,
                    error:
                        error.message
                };

            }

        }
    );

}

module.exports =
    registerFocusIPC;