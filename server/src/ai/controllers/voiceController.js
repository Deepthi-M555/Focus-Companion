const {
    transcribeAudio
} = require(
    "../services/speechService"
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
    parseResponse
} = require(
    "../utils/responseParser"
);

const {
    executeAction
} = require(
    "../services/actionExecutor"
);

const CompanionSettings =
    require(
        "../../models/CompanionSettings"
    );

exports.transcribe = async (

    req,

    res

) => {

    try {

        /*
        ============================
        Voice
        ============================
        */

        const {

            transcript,

            behaviorInsights = {},

            analytics = {}

        } = req.body;

        /*
        ============================
        Speech → Text
        ============================
        */

        const text =
            await transcribeAudio({

                transcript

            });

        /*
        ============================
        Personality
        ============================
        */

        const settings =
            await CompanionSettings.findOne({

                userId:
                    req.user._id

            });

        const personality =

            settings?.personality ||

            "GENTLE";

        /*
        ============================
        Prompt Builder
        ============================
        */

        const prompt =
            buildPrompt({

                userMessage:
                    text,

                behaviorInsights,

                analytics,

                personality

            });

        /*
        ============================
        Gemini
        ============================
        */

        const rawResponse =
            await generateResponse(
                prompt
            );

        const aiResponse =
            parseResponse(
                rawResponse
            );

        /*
        ============================
        Execute Action
        ============================
        */

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
        Return AI Response
        ============================
        */

        return res.json({

            success: true,

            transcript:
                text,

            ...aiResponse

        });

    }

    catch (error) {

        return res
            .status(500)
            .json({

                success: false,

                message:
                    error.message

            });

    }

};