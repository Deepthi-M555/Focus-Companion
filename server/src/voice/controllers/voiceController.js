const {
    detectIntent,
    executeIntent
} = require(
    "../../services/intentService"
);

const {
    STATES
} = require(
    "../../services/focusStateMachine"
);

exports.voiceCheckIn =
    async (
        req,
        res
    ) => {

        try {

            const {
                transcript
            } = req.body;

            if (
                !transcript
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error: {
                            message:
                                "Transcript is required."
                        }

                    });

            }

            const intent =
                detectIntent(
                    transcript
                );

            const result =
                executeIntent({

                    intent,

                    currentState:
                        STATES.CHECK_IN_PENDING

                });

            return res.json({

                success: true,

                transcript,

                intent,

                ...result

            });

        } catch (error) {

            return res
                .status(500)
                .json({

                    success: false,

                    error: {
                        message:
                            error.message
                    }

                });

        }

    };