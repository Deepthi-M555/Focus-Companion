const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "electronAPI",
    {

        startFocusSession: () =>
            ipcRenderer.invoke(
                "start-focus-session"
            ),

        pauseFocusSession: () =>
            ipcRenderer.invoke(
                "pause-focus-session"
            ),

        completeFocusSession: () =>
            ipcRenderer.invoke(
                "complete-focus-session"
            ),

        getPermissionStatus: () =>
            ipcRenderer.invoke(
                "permissions:get-status"
            ),

        requestMicrophonePermission: () =>
            ipcRenderer.invoke(
                "permissions:request-microphone"
            ),

        setAlwaysOnTop: (enabled) =>
            ipcRenderer.invoke(
                "permissions:set-always-on-top",
                Boolean(enabled)
            ),

        showOverlay: () =>
            ipcRenderer.invoke(
                "show-overlay"
            ),

        hideOverlay: () =>
            ipcRenderer.invoke(
                "hide-overlay"
            ),

        getOverlayStatus: () =>
            ipcRenderer.invoke(
                "overlay:get-status"
            ),

        notify: (options) =>
            ipcRenderer.invoke(
                "notify",
                options
            ),

        onCheckInRequired:
            (callback) => {

                const listener =
                    (_, data) => {

                        callback(data);

                    };

                ipcRenderer.on(
                    "check-in-required",
                    listener
                );

                return () => {

                    ipcRenderer.removeListener(
                        "check-in-required",
                        listener
                    );

                };

            }

    }
);
