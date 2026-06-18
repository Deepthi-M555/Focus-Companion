const {
    detectIntent
} = require(
    "../services/intentService"
);

exports.processVoice =
async (req, res) => {

    const {
        transcript
    } = req.body;

    const intent =
        detectIntent(
            transcript
        );

    res.json(intent);
};