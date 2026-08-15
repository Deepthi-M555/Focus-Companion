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

const CompanionSettings =
    require(
        "../../models/CompanionSettings"
    );

const {
    executeAction
} = require(
    "../services/actionExecutor"
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

const {
    applyDurationGuardrail
} = require(
    "../utils/durationGuardrail"
);

const ExpressError = require("../../utils/ExpressError");

exports.chat = async (
    req,
    res
) => {

    try {

        const {

            message,

            analytics = {}

        } = req.body;

        if (!message || !message.trim()) {
            throw new ExpressError(400, "Message is required.");
        }

        const settings =
            await CompanionSettings
                .findOne({

                    userId:
                        req.identity.userId

                });

        const personality =

            settings?.personality ||

            "GENTLE";

        const prompt =
            buildPrompt({

                userMessage:
                    message,

                analytics,

                personality

            });

        const aiResponse =
            await generateResponse(
                prompt
            );

        executeAction({
            action:
                aiResponse.action,
            io:
                req.app.get("io"),
            userId:
                req.identity.userId
        });
                
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
            applyDurationGuardrail(
                aiResponse.data.tasks || [],
                message
            );

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

        return res.status(error.statusCode || 500)
            .json({

                message:
                    error.statusCode ? error.message : "AI request failed. Please try again."

            });

    }

};

exports.addStudyGoal = async (

    req,

    res

) => {

    const {

        message,

        existingTasks = []

    } = req.body;

    if (!message || !message.trim()) {
        throw new ExpressError(400, "Message is required.");
    }

    const settings =
        await CompanionSettings.findOne({

            userId:
                req.identity.userId

        });

    const personality =
        settings?.personality ||
        "GENTLE";

    const prompt =
        buildPrompt({

            userMessage:
                `
Current timetable:

${JSON.stringify(existingTasks)}

User request:

${message}

Merge the new study goal into the existing timetable.
Return ONLY the updated study tasks.
`,

            personality,

            analytics: {}

        });

    const aiResponse =
        await generateResponse(
            prompt
        );

    const mergedTasks = [
        ...existingTasks,
        ...applyDurationGuardrail(
            aiResponse.data.tasks || [],
            message
        )
    ];

    const schedule =
        generateSchedule(
            mergedTasks
        );

    res.json({

        message:
            aiResponse.message,

        schedule

    });

};
