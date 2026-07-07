const {
    Notification
} = require("electron");

function registerNotificationIPC({

    ipcMain

}) {

    ipcMain.handle(

        "notify",

        async (

            _,

            options = {}

        ) => {

            try {

                if (

                    !Notification.isSupported()

                ) {

                    return {

                        success: false,

                        message:
                            "Notifications are not supported on this device."

                    };

                }

                const {

                    title = "FYNIX",

                    body = "",

                    silent = false

                } = options;

                const notification =
                    new Notification({

                        title,

                        body,

                        silent

                    });

                notification.show();

                return {

                    success: true,

                    message:
                        "Notification displayed successfully."

                };

            } catch (error) {

                console.error(

                    "Notification IPC Error:",

                    error

                );

                return {

                    success: false,

                    message:
                        "Failed to display notification."

                };

            }

        }

    );

}

module.exports =
    registerNotificationIPC;