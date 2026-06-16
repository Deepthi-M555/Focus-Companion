const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "electronAPI",
    {

        startFocusMode: () =>
            ipcRenderer.send(
                "focus-mode"
            ),

        pauseSession: () =>
            ipcRenderer.send(
                "pause-session"
            ),

        completeSession: () =>
            ipcRenderer.send(
                "complete-session"
            ),

        showOverlay: () =>
            ipcRenderer.send(
                "show-overlay"
            ),

        hideOverlay: () =>
            ipcRenderer.send(
                "hide-overlay"
            ),

        onVoiceCheckIn: (
            callback
        ) => {

            const listener = (
                event,
                payload
            ) => {

                callback(payload);

            };

            ipcRenderer.on(
                "voice-check-in",
                listener
            );

            return () => {

                ipcRenderer.removeListener(
                    "voice-check-in",
                    listener
                );

            };

        }

    }
);