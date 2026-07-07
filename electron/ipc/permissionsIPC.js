function toStatus(value) {
    if (value === "granted") {
        return "granted";
    }

    if (value === "denied" || value === "restricted") {
        return "denied";
    }

    return "not_available";
}

function registerPermissionsIPC({
    ipcMain,
    systemPreferences,
    overlayWindow
}) {

    const getMicrophoneStatus =
        () =>
            typeof systemPreferences?.getMediaAccessStatus === "function"
                ? toStatus(systemPreferences.getMediaAccessStatus("microphone"))
                : "not_available";

    const getAlwaysOnTopStatus =
        () =>
            overlayWindow &&
            !overlayWindow.isDestroyed() &&
            typeof overlayWindow.isAlwaysOnTop === "function"
                ? (
                    overlayWindow.isAlwaysOnTop()
                        ? "granted"
                        : "denied"
                )
                : "not_available";

    ipcMain.handle(
        "permissions:get-status",
        async () => {

            try {

            return {
                success: true,
                microphone: getMicrophoneStatus(),
                alwaysOnTop: getAlwaysOnTopStatus()
            };

            } catch (error) {

                return {
                    success: false,
                    error: error.message || "Unable to read permissions",
                    microphone: "not_available",
                    alwaysOnTop: "not_available"
                };

            }
        }
    );

    ipcMain.handle(
        "permissions:request-microphone",
        async () => {

            try {

                const currentStatus =
                    getMicrophoneStatus();

                if (
                    currentStatus === "granted" ||
                    currentStatus === "denied"
                ) {

                    return {
                        success: currentStatus === "granted",
                        microphone: currentStatus,
                        error:
                            currentStatus === "denied"
                                ? "Microphone permission denied"
                                : undefined
                    };

                }

                if (
                    typeof systemPreferences?.askForMediaAccess !== "function"
                ) {

                    return {
                        success: false,
                        microphone: currentStatus,
                        error: "Microphone permission is not available"
                    };

                }

                const granted =
                    await systemPreferences.askForMediaAccess("microphone");

                return {
                    success: granted,
                    microphone: granted ? "granted" : "denied",
                    error: granted ? undefined : "Microphone permission denied"
                };

            } catch (error) {

                return {
                    success: false,
                    microphone: getMicrophoneStatus(),
                    error: error.message || "Unable to request microphone permission"
                };

            }

        }
    );

    ipcMain.handle(
        "permissions:set-always-on-top",
        async (_, enabled) => {

            try {

                if (
                    !overlayWindow ||
                    overlayWindow.isDestroyed()
                ) {

                    return {
                        success: false,
                        alwaysOnTop: "not_available",
                        error: "Overlay window unavailable"
                    };

                }

                overlayWindow.setAlwaysOnTop(Boolean(enabled));

                return {
                    success: true,
                    alwaysOnTop:
                        overlayWindow.isAlwaysOnTop()
                            ? "granted"
                            : "denied"
                };

            } catch (error) {

                return {
                    success: false,
                    alwaysOnTop: getAlwaysOnTopStatus(),
                    error: error.message || "Unable to update always on top"
                };

            }

        }
    );

}

module.exports =
    registerPermissionsIPC;
