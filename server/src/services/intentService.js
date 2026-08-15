const {
    classifyIntent
} = require("../ai/providers/openRouterProvider");

const {
    STATES,
    transition
} = require("./focusStateMachine");

async function detectIntent(transcript) {
    const text =
        String(
            transcript || ""
        )
        .trim()
        .toLowerCase();

    if (!text) {
        return {
            intent: "UNKNOWN",
            duration: 0,
            confidence: 0,
            reply:
                "I couldn't hear a clear response."
        };
    }
    try {
        const result =
            await classifyIntent(
                transcript
            );
        if (result) {
            return {
                intent:
                    String(
                        result.intent ||
                        "UNKNOWN"
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
    } catch (error) {
        console.error(
            "AI intent detection failed. Using deterministic fallback:",
            error.message
        );
    }
    /*
     * Deterministic fallback.
     * AI remains the primary classifier.
     */
    const completionPatterns = [
        "i finished",
        "finished it",
        "i'm done",
        "im done",
        "done",
        "completed",
        "i completed",
        "yes completed",
        "yes i finished",
        "task is complete",
        "i am finished"
    ];
    const helpPatterns = [
        "need help",
        "i need help",
        "i'm stuck",
        "im stuck",
        "stuck",
        "couldn't finish",
        "could not finish",
        "not finished",
        "i need more time",
        "couldn't complete",
        "could not complete"
    ];
    if (
        completionPatterns.some(
            pattern =>
                text.includes(pattern)
        )
    ) {
        return {
            intent:
                "COMPLETE_SESSION",
            duration: 0,
            confidence: 0.75,
            reply: "",
            raw: {
                source:
                    "deterministic-fallback"
            }
        };
    }
    if (
        helpPatterns.some(
            pattern =>
                text.includes(pattern)
        )
    ) {
        return {
            intent:
                "NEED_HELP",
            duration: 0,
            confidence: 0.75,
            reply: "",
            raw: {
                source:
                    "deterministic-fallback"
            }
        };
    }
    return {
        intent: "UNKNOWN",
        duration: 0,
        confidence: 0,
        reply:
            "Please tell me whether you finished the task or need help.",
        raw: {
            source:
                "deterministic-fallback"
        }
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