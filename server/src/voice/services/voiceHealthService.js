const axios =
    require("axios");

const VOICE_SERVICE_URL =
    process.env.VOICE_SERVICE_URL ||
    "http://127.0.0.1:8000";

async function checkVoiceService() {

    try {

        const response =
            await axios.get(
                `${VOICE_SERVICE_URL}/health`,
                {
                    timeout: 5000
                }
            );

        return {
            available: true,
            data: response.data
        };

    } catch {

        return {
            available: false
        };
    }
}

module.exports = {
    checkVoiceService
};