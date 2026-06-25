async function transcribeAudio({

    transcript,

    audioBuffer

}) {

    /*
        Development Mode

        Later this function can
        call Gemini Audio,
        Faster Whisper,
        etc.
    */

    if (transcript) {

        return transcript.trim();

    }

    throw new Error(
        "Speech transcription not available."
    );

}

module.exports = {
    transcribeAudio
};