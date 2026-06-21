const {
    GoogleGenerativeAI
} = require(
    "@google/generative-ai"
);

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );

const model =
    genAI.getGenerativeModel({

        model:
            "gemini-1.5-flash"

    });

async function generateResponse(
    prompt
) {

    try {

        const result =
            await model.generateContent(
                prompt
            );

        const text =
            result.response.text();

        let parsed;

        try {

            parsed =
                JSON.parse(text);

        } catch {

            parsed = {

                message:
                    "I couldn't understand the response.",

                action:
                    "NONE",

                suggestions: [],

                data: {}

            };

        }

        return {

            message:
                parsed.message || "",

            action:
                parsed.action || "NONE",

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

        return {

            message:
                "AI service unavailable.",

            action:
                "NONE",

            suggestions: [],

            data: {}

        };

    }

}

module.exports = {
    generateResponse
};