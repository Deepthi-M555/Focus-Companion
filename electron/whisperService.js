const {
    app
} = require("electron");

const {
    spawn
} = require("node:child_process");

const fs =
    require("node:fs");

const path =
    require("node:path");

const http =
    require("node:http");


const WHISPER_HOST =
    "127.0.0.1";

const WHISPER_PORT =
    8001;


let whisperProcess =
    null;


function isPackaged() {

    return app.isPackaged;

}


function getWhisperPaths() {

    /*
     * =========================
     * PRODUCTION
     * =========================
     *
     * Electron Builder places
     * extraResources outside app.asar:
     *
     * resources/
     *   voice-service/
     *     fynix-voice.exe
     *     models/
     *       small.en/
     */

    if (isPackaged()) {

        const base =
            path.join(
                process.resourcesPath,
                "voice-service"
            );

        return {

            executable:
                path.join(
                    base,
                    "fynix-voice.exe"
                ),

            cwd:
                base,

            model:
                path.join(
                    base,
                    "models",
                    "small.en"
                )

        };

    }


    /*
     * =========================
     * DEVELOPMENT
     * =========================
     */

    const base =
        path.join(
            __dirname,
            "..",
            "voice-service"
        );

    return {

        executable:
            path.join(
                base,
                "venv",
                "Scripts",
                "python.exe"
            ),

        cwd:
            base,

        model:
            path.join(
                base,
                "models",
                "small.en"
            )

    };

}


function isWhisperRunning() {

    return (
        whisperProcess &&
        whisperProcess.exitCode === null
    );

}


function startWhisper() {

    if (
        isWhisperRunning()
    ) {

        console.log(
            "[WHISPER] Already running."
        );

        return;

    }


    const paths =
        getWhisperPaths();


    /*
     * Verify executable.
     */

    if (
        !fs.existsSync(
            paths.executable
        )
    ) {

        console.error(
            "[WHISPER] executable not found:",
            paths.executable
        );

        return;

    }


    /*
     * Verify model in packaged mode.
     */

    if (
        isPackaged() &&
        !fs.existsSync(
            paths.model
        )
    ) {

        console.error(
            "[WHISPER] model not found:",
            paths.model
        );

        return;

    }


    let command;
    let args = [];


    /*
     * =========================
     * PRODUCTION
     * =========================
     *
     * Run PyInstaller EXE directly.
     */

    if (
        isPackaged()
    ) {

        command =
            paths.executable;

        args = [];

    }


    /*
     * =========================
     * DEVELOPMENT
     * =========================
     *
     * Run Python + Uvicorn.
     */

    else {

        command =
            paths.executable;

        args = [

            "-m",

            "uvicorn",

            "app:app",

            "--host",

            WHISPER_HOST,

            "--port",

            String(
                WHISPER_PORT
            )

        ];

    }


    const env = {

        ...process.env,

        WHISPER_DEVICE:
            "cpu",

        WHISPER_COMPUTE_TYPE:
            "int8",

        WHISPER_MODEL:
            "small.en",

        WHISPER_MODEL_PATH:
            paths.model

    };


    console.log(
        "[WHISPER] executable:",
        paths.executable
    );

    console.log(
        "[WHISPER] model:",
        paths.model
    );


    whisperProcess =
        spawn(
            command,
            args,
            {

                cwd:
                    paths.cwd,

                env,

                windowsHide:
                    true,

                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ]

            }
        );


    console.log(
        "[WHISPER] started:",
        whisperProcess.pid
    );


    whisperProcess.stdout.on(
        "data",
        chunk => {

            console.log(
                "[WHISPER]",
                chunk
                    .toString()
                    .trim()
            );

        }
    );


    whisperProcess.stderr.on(
        "data",
        chunk => {

            console.error(
                "[WHISPER]",
                chunk
                    .toString()
                    .trim()
            );

        }
    );


    whisperProcess.on(
        "error",
        error => {

            console.error(
                "[WHISPER] process error:",
                error
            );

        }
    );


    whisperProcess.on(
        "close",
        code => {

            console.log(
                "[WHISPER] exited:",
                code
            );

            whisperProcess =
                null;

        }
    );

}


function stopWhisper() {

    if (
        !isWhisperRunning()
    ) {

        whisperProcess =
            null;

        return;

    }


    try {

        whisperProcess.kill();

    } catch (
        error
    ) {

        console.error(
            "[WHISPER] stop failed:",
            error
        );

    }


    whisperProcess =
        null;

}


function waitForWhisper(
    timeoutMs = 60000
) {

    const start =
        Date.now();


    return new Promise(
        resolve => {

            const check =
                () => {

                    if (
                        Date.now() -
                        start >
                        timeoutMs
                    ) {

                        resolve(
                            false
                        );

                        return;

                    }


                    const request =
                        http.get(
                            {

                                hostname:
                                    WHISPER_HOST,

                                port:
                                    WHISPER_PORT,

                                path:
                                    "/health",

                                timeout:
                                    1500

                            },

                            response => {

                                let body =
                                    "";

                                response.on(
                                    "data",
                                    chunk => {

                                        body +=
                                            chunk.toString();

                                    }
                                );


                                response.on(
                                    "end",
                                    () => {

                                        if (
                                            response.statusCode ===
                                            200
                                        ) {

                                            console.log(
                                                "[WHISPER] health OK:",
                                                body
                                            );

                                            resolve(
                                                true
                                            );

                                        } else {

                                            setTimeout(
                                                check,
                                                500
                                            );

                                        }

                                    }
                                );

                            }
                        );


                    request.on(
                        "error",
                        () => {

                            setTimeout(
                                check,
                                500
                            );

                        }
                    );


                    request.on(
                        "timeout",
                        () => {

                            request.destroy();

                            setTimeout(
                                check,
                                500
                            );

                        }
                    );

                };


            check();

        }
    );

}


module.exports = {

    startWhisper,

    stopWhisper,

    waitForWhisper

};