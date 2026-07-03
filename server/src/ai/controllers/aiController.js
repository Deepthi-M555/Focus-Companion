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

        const settings =
            await CompanionSettings
                .findOne({

                    userId:
                        req.user._id

                });

        const personality =

            settings?.personality ||

            "GENTLE";

        const prompt =
            buildPrompt({

                userMessage:
                    message,

                behaviorInsights,

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
                req.user._id

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

exports.addStudyGoal = async (

    req,

    res

) => {

    const {

        message,

        existingTasks = []

    } = req.body;

    const settings =
        await CompanionSettings.findOne({

            userId:
                req.user._id

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

            analytics: {},

            behaviorInsights: {}

        });

    const aiResponse =
        await generateResponse(
            prompt
        );

    const mergedTasks = [

        ...existingTasks,

        ...(aiResponse.data.tasks || [])

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
