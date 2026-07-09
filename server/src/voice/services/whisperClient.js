const fs = require("fs");

async function transcribeAudio(filePath) {

    const formData = new FormData();

    formData.append(
        "audio",
        new Blob([
            fs.readFileSync(filePath)
        ]),
        "voice.webm"
    );

    const response =
        await fetch(
            "http://127.0.0.1:8000/transcribe",
            {
                method: "POST",
                body: formData
            }
        );

    if (!response.ok) {

        throw new Error(
            "Whisper service unavailable."
        );

    }

    return await response.json();

}

module.exports = {
    transcribeAudio
};