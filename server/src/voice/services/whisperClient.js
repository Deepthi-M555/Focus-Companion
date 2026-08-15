const fs = require("fs");
const path = require("path");

const VOICE_SERVICE_URL =
    process.env.VOICE_SERVICE_URL ||
    "http://127.0.0.1:8000";

function delay(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}

async function transcribeAudio(audioPath) {

    if (!audioPath) {
        throw new Error(
            "Audio path is required."
        );
    }

    for (
        let attempt = 1;
        attempt <= 2;
        attempt++
    ) {

        try {

            const audioBuffer =
                await fs.promises.readFile(
                    audioPath
                );

            const form =
                new FormData();

            const filename =
                path.basename(
                    audioPath
                ) || "voice.webm";

            form.append(
                "audio",
                new Blob(
                    [audioBuffer],
                    {
                        type: "audio/webm"
                    }
                ),
                filename
            );

            const controller =
                new AbortController();

            const timeout =
                setTimeout(
                    () =>
                        controller.abort(),
                    60000
                );

            const response =
                await fetch(
                    `${VOICE_SERVICE_URL}/transcribe`,
                    {
                        method: "POST",
                        body: form,
                        signal: controller.signal
                    }
                );

            clearTimeout(timeout);

            if (response.ok) {
                return await response.json();
            }

            const error =
                await response.text();

            if (attempt === 2) {
                throw new Error(
                    `Whisper service failed: ${error}`
                );
            }

        } catch (error) {

            if (attempt === 2) {

                throw new Error(
                    error.message ||
                    "Voice transcription failed."
                );
            }
        }

        await delay(500);
    }
}

module.exports = {
    transcribeAudio
};