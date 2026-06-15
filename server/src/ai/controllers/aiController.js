const {
    buildPrompt
} = require("../services/promptBuilder");

const {
    generateResponse
} = require("../services/geminiService");

const {
    parseResponse
} = require("../utils/responseParser");

exports.chat = async (
    req,
    res
) => {

    const {

        message,

        behaviorInsights = {},

        analytics = {}

    } = req.body;

    const prompt =
        buildPrompt({

            userMessage: message,

            behaviorInsights,

            analytics

        });

    const aiText =
        await generateResponse(prompt);

    const parsed =
        parseResponse(aiText);

    res.json(parsed);

};