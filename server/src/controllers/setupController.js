const CompanionSettings =
    require("../models/CompanionSettings");

const ExpressError =
    require("../utils/ExpressError");


module.exports.saveSetup = async (req, res) => {

    const {
        micEnabled,
        notificationsEnabled,
        overlayEnabled,
        voiceResponseTimeout,
        snoozeDuration,
        maxSnoozes
    } = req.body;


    const normalizedVoiceResponseTimeout =
        Number(voiceResponseTimeout);

    const normalizedSnoozeDuration =
        Number(snoozeDuration);

    const normalizedMaxSnoozes =
        Number(maxSnoozes);


    if (
        !Number.isFinite(normalizedVoiceResponseTimeout) ||
        normalizedVoiceResponseTimeout <= 0 ||

        !Number.isFinite(normalizedSnoozeDuration) ||
        normalizedSnoozeDuration <= 0 ||

        !Number.isFinite(normalizedMaxSnoozes) ||
        normalizedMaxSnoozes < 1 ||
        normalizedMaxSnoozes > 5
    ) {
        throw new ExpressError(
            400,
            "Invalid setup values."
        );
    }


    const setup =
        await CompanionSettings.findOneAndUpdate(

            {
                userId: req.identity.userId
            },

            {
                userId: req.identity.userId,

                voiceEnabled: micEnabled,

                notificationsEnabled,

                overlayEnabled,

                voiceResponseTimeout:
                    normalizedVoiceResponseTimeout,

                snoozeDuration:
                    normalizedSnoozeDuration,

                maxSnoozes:
                    normalizedMaxSnoozes
            },

            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );


    res.status(200).json({

        message:
            "Setup saved successfully.",

        setup
    });
};


module.exports.getSetup = async (req, res) => {

    const setup =
    await CompanionSettings.findOneAndUpdate(
        {
            userId: req.identity.userId
        },
        {
            $setOnInsert: {
                userId: req.identity.userId
            }
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );

    res.status(200).json({
        setup
    });
};