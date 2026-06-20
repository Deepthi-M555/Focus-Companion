const {
    generateSchedule
} = require(
    "../../services/schedulingService"
);

const {
    recoverSchedule
} = require(
    "../../services/recoveryService"
);

const {
    RESPONSE_ACTIONS
} = require(
    "../utils/responseActions"
);

const {
    buildPrompt
} = require(
    "../services/promptBuilder"
);

const {
    generateResponse
} = require(
    "../services/geminiService"
);

exports.chat = async (
    req,
    res
) => {

    try {

        const {

            message,

            behaviorInsights = {},

            analytics = {}

        } = req.body;

        const prompt =
            buildPrompt({

                userMessage:
                    message,

                behaviorInsights,

                analytics

            });

        const aiResponse =
            await generateResponse(
                prompt
            );

        /*
        ============================
        TIMETABLE GENERATION
        ============================
        */

        if (

            aiResponse.action ===
            RESPONSE_ACTIONS.GENERATE_TIMETABLE

        ) {

            const tasks =
                aiResponse.data.tasks || [];

            const schedule =
                generateSchedule(
                    tasks
                );

            return res.json({

                ...aiResponse,

                schedule

            });

        }

        /*
        ============================
        TIMETABLE RECOVERY
        ============================
        */

        if (

            aiResponse.action ===
            RESPONSE_ACTIONS.REGENERATE_TIMETABLE

        ) {

            const recovery =
                recoverSchedule({

                    remainingTasks:

                        aiResponse.data
                            .remainingTasks || [],

                    availableMinutes:

                        aiResponse.data
                            .availableMinutes || 0

                });

            return res.json({

                ...aiResponse,

                recovery

            });

        }

        /*
        ============================
        NORMAL CHAT RESPONSE
        ============================
        */

        return res.json(
            aiResponse
        );

    } catch (error) {

        console.error(
            error
        );

        return res.status(500)
            .json({

                message:
                    "AI request failed."

            });

    }

};