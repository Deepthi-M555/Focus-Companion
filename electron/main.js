const {
    app,
    ipcMain,
    BrowserWindow,
    systemPreferences
} = require("electron");

if (process.platform === "win32") {
    app.setAppUserModelId(
        "com.fynix.productivity"
    );
}

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const createMainWindow =
    require("./createMainWindow");

const createOverlay =
    require("./createOverlay");

const registerOverlayIPC =
    require("./ipc/overlayIPC");

const registerFocusIPC =
    require("./ipc/focusIPC");

const registerPermissionsIPC =
    require("./ipc/permissionsIPC");

const registerNotificationIPC =
    require("./ipc/notificationIPC");

const {
    startWhisper,
    stopWhisper,
    waitForWhisper
} = require(
    "./whisperService"
);

// Set development environment if --dev flag is passed
if (process.argv.includes("--dev")) {
    process.env.NODE_ENV = "development";
}

let mainWindow;
let overlayWindow;
let activeTtsProcess = null;

function sanitizeTtsText(text) {
    if (typeof text !== "string") {
        return "";
    }

    const safeText = text.trim();

    if (!safeText) {
        return "";
    }

    return safeText.slice(0, 500).replace(/\s+/g, " ");
}

function stopNativeTts() {
    if (activeTtsProcess && !activeTtsProcess.killed) {
        try {
            activeTtsProcess.kill("SIGTERM");
            console.log("[TTS:NATIVE] stopped previous process");
        } catch (error) {
            console.warn("[TTS:NATIVE] failed to stop native speech:", error);
        }
    }

    activeTtsProcess = null;
}

function ensureOverlayWindow() {
    if (
        overlayWindow &&
        !overlayWindow.isDestroyed()
    ) {
        return overlayWindow;
    }

    overlayWindow = createOverlay({
        app
    });

    return overlayWindow;
}

function createTrackedMainWindow() {

    const window =
        createMainWindow();

    window.on(
        "closed",
        () => {

            mainWindow = null;

            if (
                process.platform !== "darwin"
            ) {

                app.quit();

            }

        }
    );

    return window;
}

ipcMain.handle(
    "tts:stop",
    async () => {
        try {
            stopNativeTts();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message || "Unable to stop native TTS"
            };
        }
    }
);

ipcMain.handle("tts:speak", async (_, text) => {
    try {
        const safeText = sanitizeTtsText(text);

        if (!safeText) {
            return {
                success: false,
                error: "No text supplied"
            };
        }

        // Stop previous FYNIX speech
        stopNativeTts();

        console.log(
            "[TTS:NATIVE] requested:",
            safeText
        );

        const script = `
            $ErrorActionPreference = "Stop"

            Add-Type -AssemblyName System.Speech

            $text = [Environment]::GetEnvironmentVariable("FYNIX_TTS_TEXT")

            if ([string]::IsNullOrWhiteSpace($text)) {
                throw "FYNIX_TTS_TEXT is empty"
            }

            Write-Host "[TTS:NATIVE] System.Speech loaded"

            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

            Write-Host "[TTS:NATIVE] synthesizer created"

            $voices = $synth.GetInstalledVoices()

            Write-Host "[TTS:NATIVE] installed voices:"

            foreach ($voice in $voices) {
                $info = $voice.VoiceInfo

                Write-Host (
                    "[TTS:NATIVE] " +
                    $info.Name +
                    " | " +
                    $info.Culture +
                    " | " +
                    $info.Gender +
                    " | Enabled=" +
                    $info.Enabled
                )
            }

            $synth.SelectVoice("Microsoft Zira Desktop")

            Write-Host "[TTS:NATIVE] selected voice: Microsoft Zira Desktop"

            $synth.Volume = 100
            $synth.Rate = 0

            Write-Host "[TTS:NATIVE] Speak() started"

            $synth.Speak($text)

            Write-Host "[TTS:NATIVE] Speak() completed"

            $synth.Dispose()

            exit 0
        `;

        const child = spawn(
            "powershell.exe",
            [
                "-NoProfile",
                "-STA",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                script
            ],
            {
                // IMPORTANT:
                // Keep this FALSE for this test.
                // We want to reproduce the exact PowerShell
                // environment that we know produces audio.
                windowsHide: false,

                env: {
                    ...process.env,
                    FYNIX_TTS_TEXT: safeText
                },

                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ]
            }
        );

        activeTtsProcess = child;

        console.log(
            "[TTS:NATIVE] process started:",
            child.pid
        );

        let stderr = "";

        child.stdout.on("data", (chunk) => {
            console.log(
                chunk.toString().trim()
            );
        });

        child.stderr.on("data", (chunk) => {
            const output =
                chunk.toString();

            stderr += output;

            console.error(
                "[TTS:NATIVE] stderr:",
                output
            );
        });

        return await new Promise((resolve) => {

            child.on("error", (error) => {

                console.error(
                    "[TTS:NATIVE] process error:",
                    error
                );

                if (activeTtsProcess === child) {
                    activeTtsProcess = null;
                }

                resolve({
                    success: false,
                    error: error.message
                });
            });

            child.on("close", (code, signal) => {

                console.log(
                    "[TTS:NATIVE] process exited:",
                    {
                        code,
                        signal
                    }
                );

                if (activeTtsProcess === child) {
                    activeTtsProcess = null;
                }

                if (code === 0) {

                    console.log(
                        "[TTS:NATIVE] SUCCESS — Zira completed"
                    );

                    resolve({
                        success: true
                    });

                } else {

                    console.error(
                        "[TTS:NATIVE] FAILED:",
                        stderr
                    );

                    resolve({
                        success: false,
                        error:
                            stderr ||
                            `PowerShell exited with code ${code}`
                    });
                }
            });
        });

    } catch (error) {

        console.error(
            "[TTS:NATIVE] exception:",
            error
        );

        return {
            success: false,
            error: error.message
        };
    }
});

app.on(
    "before-quit",
    () => {

        app.isQuitting =
            true;

        stopNativeTts();

        stopWhisper();

    }
);

app.whenReady().then(async () => {

    console.log(
        "[WHISPER] Starting local voice service..."
    );

    startWhisper();

    const whisperReady =
        await waitForWhisper();

    if (
        whisperReady
    ) {

        console.log(
            "[WHISPER] Local voice service ready."
        );

    } else {

        console.warn(
            "[WHISPER] Local voice service did not become ready."
        );

    }


    mainWindow =
        createTrackedMainWindow();

    overlayWindow =
        ensureOverlayWindow();
    registerOverlayIPC({
        ipcMain,
        overlayWindow,
        mainWindow
    });
    registerFocusIPC({
        ipcMain,
        BrowserWindow
    });
    registerPermissionsIPC({
        ipcMain,
        systemPreferences,
        overlayWindow
    });
    registerNotificationIPC({
        ipcMain
    });
});

app.on(
    "window-all-closed",
    () => {
        if (
            process.platform !== "darwin"
        ) {
            app.isQuitting = true;
            app.quit();
        }
    }
);
app.on(
    "activate",
    () => {
        if (
            !mainWindow ||
            mainWindow.isDestroyed()
        ) {
            mainWindow =
                createTrackedMainWindow();
        }
    }
);