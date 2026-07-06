const {
    GoogleGenerativeAI
} = require(
    "@google/generative-ai"
);

const ExpressError = require("../../utils/ExpressError");

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );

const model =
    genAI.getGenerativeModel({

        model:
            process.env.GEMINI_MODEL

    });

async function generateResponse(
    prompt
) {

    if (!process.env.GEMINI_API_KEY) {
        throw new ExpressError(503, "AI service is not configured.");
    }

    try {

        const result =
            await model.generateContent(
                prompt
            );

        const text =
            result.response.text();

        if (!text || !text.trim()) {
            throw new ExpressError(502, "AI service returned an empty response.");
        }

        let parsed;

        try {

            const normalizedText = text
                .trim()
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/, "");

            parsed = JSON.parse(normalizedText);

        } catch {

            throw new ExpressError(502, "AI service returned an invalid response.");

        }

        return {

            message:
                parsed.message || "",

            action:
                parsed.action ?? null,

            suggestions:
                parsed.suggestions || [],

            data:
                parsed.data || {}

        };

    } catch (error) {

        console.error(
            "Gemini Error:",
            error
        );

        if (error instanceof ExpressError) {
            throw error;
        }

        const errorMessage = error.message || "";
        const errorStatus = error.status || error.statusCode;

        if (
            errorStatus === 404 ||
            /model.*(?:not found|does not exist|not supported)/i.test(errorMessage)
        ) {
            throw new ExpressError(
                503,
                "AI model configuration is invalid. Please contact support."
            );
        }

        if (
            errorStatus === 401 ||
            errorStatus === 403 ||
            /api key|API_KEY_INVALID|permission denied|unauthenticated/i.test(errorMessage)
        ) {
            throw new ExpressError(
                503,
                "AI service authentication failed."
            );
        }

        throw new ExpressError(
            503,
            "AI service is temporarily unavailable. Please try again in a few minutes."
        );

    }

}

module.exports = {
    generateResponse
};
