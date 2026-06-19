const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "electronAPI",
    {

        startFocusSession: () =>
            ipcRenderer.send(
                "start-focus-session"
            ),

        pauseFocusSession: () =>
            ipcRenderer.send(
                "pause-focus-session"
            ),

        completeFocusSession: () =>
            ipcRenderer.send(
                "complete-focus-session"
            ),

        showOverlay: () =>
            ipcRenderer.send(
                "show-overlay"
            ),

        hideOverlay: () =>
            ipcRenderer.send(
                "hide-overlay"
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