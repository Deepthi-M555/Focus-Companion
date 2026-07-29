const {
    classifyIntent
} = require("../ai/providers/openRouterProvider");

const {
    STATES,
    transition
} = require("./focusStateMachine");

async function detectIntent(transcript) {

    const result =
        await classifyIntent(transcript);

    if (!result) {
        return {
            intent: "UNKNOWN",
            duration: 0,
            confidence: 0,
            reply: "",
            raw: null
        };
    }

    return {
        intent:
            String(
                result.intent || "UNKNOWN"
            )
            .trim()
            .toUpperCase(),

        duration:
            result.duration ?? 0,

        confidence:
            result.confidence ?? 1,

        reply:
            result.reply ?? "",

        raw:
            result
    };
}

function executeIntent({
    intent,
    currentState
}) {

    switch (intent) {

        case "COMPLETE_SESSION":
            return {
                nextState:
                    transition({
                        currentState,
                        nextState:
                            STATES.COMPLETED
                    }),

                action:
                    "COMPLETE"
            };

        case "NEED_HELP":
            return {
                nextState:
                    transition({
                        currentState,
                        nextState:
                            STATES.RECOVERY_ENGINE
                    }),

                action:
                    "RECOVERY"
            };

        default:
            return {
                nextState:
                    currentState,

                action:
                    "NONE"
            };
    }
}

module.exports = {
    detectIntent,
    executeIntent
};