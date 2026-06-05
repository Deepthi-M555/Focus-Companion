const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(

  "electronAPI",

  {

    focusMode: () =>

      ipcRenderer.send(
        "focus-mode"
      ),

    onCheckIn: (callback) =>

      ipcRenderer.on(
        "check-in",
        callback
      )

  }

);



/*WHAT THIS DOES

You safely expose:

window.electronAPI

to React.

NOT full Node.js.

VERY important security architecture.

FLOW
React
↓
window.electronAPI.focusMode()
↓
IPC message
↓
Electron Main Process
↓
native desktop action

THIS is:

inter-process communication.*/