const Setup = require("../models/Setup");
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
        await Setup.findOneAndUpdate(

            {
                user: req.identity.userId
            },

            {
                micEnabled,
                notificationsEnabled,
                overlayEnabled,
                checkInFrequency,
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

    const setup = await Setup.findOne({
        user: req.identity.userId
    });

    res.status(200).json({
        setup
    });

};