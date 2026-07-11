const CompanionSettings=require("../models/CompanionSettings");
const ExpressError = require("../utils/ExpressError");

module.exports.saveSetup = async (req, res) => {

    const {
        micEnabled,
        notificationsEnabled,
        overlayEnabled,
        checkInFrequency,
        snoozeDuration,
        maxSnoozes
    } = req.body;

    if (
        checkInFrequency == null ||
        snoozeDuration == null ||
        maxSnoozes == null
    ) {
        throw new ExpressError(
            400,
            "Missing required setup fields."
        );
    }
    if (
        checkInFrequency <= 0 ||
        snoozeDuration <= 0 ||
        maxSnoozes < -1
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
            userId:req.identity.userId,
            voiceEnabled:micEnabled,
            notificationsEnabled,
            overlayEnabled,
            checkInInterval:checkInFrequency,
            voiceResponseTimeout:60,
            snoozeDuration,
            maxSnoozes
            },

            {
                new: true,
                upsert: true,
                runValidators: true
            }

        );

    res.status(200).json({

        message: "Setup saved successfully.",

        setup

    });

};

module.exports.getSetup = async (req, res) => {

    const setup = await CompanionSettings.findOne({
        userId: req.identity.userId
    });

    res.status(200).json({
        setup
    });

};