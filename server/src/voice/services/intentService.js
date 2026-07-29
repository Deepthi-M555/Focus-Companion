const {
    classifyIntent
} = require(
    "../ai/providers/openRouterProvider"
);

async function detectIntent(
    transcript
) {
    return await classifyIntent(
        transcript
    );

}

module.exports = {

    detectIntent

};