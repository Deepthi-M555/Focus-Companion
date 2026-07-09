const path = require("path");

const {
    transcribeAudio
} = require("../services/whisperClient");

const {
    deleteRecording
} = require("../services/recorderService");

const {
    detectIntent
} = require(
    "../../services/intentService"
);

exports.processVoice = async (
    req,
    res
) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message:
                "Audio file is required."
        });
    }
    const audioPath =
        req.file.path;
    try {
        const result =
            await transcribeAudio(
                audioPath
            );

        const transcript =
            result.text;

        const intent =
            await detectIntent(
                transcript
            );
        return res.json({
            success: true,
            transcript,
            intent
        });
    }
    finally {
        await deleteRecording(
            audioPath
        );
    }
};