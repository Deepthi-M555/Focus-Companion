const {
    STATES,
    transition
} = require(
    "./focusStateMachine"
);

function detectIntent(
    transcript
) {

    const text =
        transcript.toLowerCase();

    const completeKeywords = [

        "yes",
        "done",
        "completed",
        "finished",
        "finish",
        "i did it"

    ];

    const snoozeKeywords = [

        "snooze",
        "later",
        "5 minutes",
        "10 minutes"

    ];

    const helpKeywords = [

        "help",
        "stuck",
        "confused",
        "can't focus"

    ];

    if (
        completeKeywords.some(
            keyword =>
                text.includes(keyword)
        )
    ) {

        return "COMPLETE_SESSION";

    }

    if (
        snoozeKeywords.some(
            keyword =>
                text.includes(keyword)
        )
    ) {

        return "SNOOZE_SESSION";

    }

    if (
        helpKeywords.some(
            keyword =>
                text.includes(keyword)
        )
    ) {

        return "NEED_HELP";

    }

    return "UNKNOWN";

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

        case "SNOOZE_SESSION":

            return {

                nextState:
                    transition({

                        currentState,

                        nextState:
                            STATES.SNOOZED

                    }),

                action:
                    "SNOOZE"

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