const {
    GoogleGenerativeAI
} = require("@google/generative-ai");

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );

const model =
    genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
    });

async function generateResponse(prompt) {

    const result =
        await model.generateContent(prompt);

    const response =
        result.response;

    return response.text();
}

module.exports = {
    generateResponse
};