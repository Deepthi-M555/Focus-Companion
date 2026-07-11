const bcrypt = require("bcrypt");

const User = require("../models/User");
const CompanionSettings = require("../models/CompanionSettings");

const ExpressError = require("../utils/ExpressError");

module.exports.getSettings = async (req, res) => {

    const user = await User.findById(
        req.identity.userId
    ).select("name email");

    const setup=
    await CompanionSettings.findOne({
    userId:req.identity.userId
    });

    res.json({

        name: user?.name || "",

        email: user.email,

        voiceEnabled:
setup?.voiceEnabled ?? true,
        notificationsEnabled:
            setup?.notificationsEnabled ?? true,

        overlayEnabled:
            setup?.overlayEnabled ?? true,

        startupEnabled:
            setup?.startupEnabled ?? false,

        checkInFrequency:
            setup?.checkInFrequency ?? 30,

        snoozeDuration:
            setup?.snoozeDuration ?? 5,

        maxSnoozes:
            setup?.maxSnoozes ?? 3

    });

};

module.exports.updateProfile = async (req, res) => {

    const { name } = req.body;

    if (!name) {

        throw new ExpressError(
            400,
            "Name is required."
        );

    }

    const user =
        await User.findByIdAndUpdate(

            req.identity.userId,

            {
                name
            },

            {
                new: true,
                runValidators: true
            }

        );

    res.json({

        message:
            "Profile updated successfully.",

        user: {
            name: user.name,
            email: user.email,
            avatar: ""
        }

    });

};

module.exports.updatePreferences =
async (req, res) => {

    const {

        micEnabled,

        notificationsEnabled,

        overlayEnabled,

        startupEnabled,

        checkInFrequency,

        snoozeDuration,

        maxSnoozes

    } = req.body;

    const normalizedCheckInFrequency = Number(checkInFrequency);
    const normalizedSnoozeDuration = Number(snoozeDuration);
    const normalizedMaxSnoozes = maxSnoozes === -1 ? -1 : Number(maxSnoozes);

    if (

        !Number.isFinite(normalizedCheckInFrequency) ||
        normalizedCheckInFrequency <= 0 ||
        !Number.isFinite(normalizedSnoozeDuration) ||
        normalizedSnoozeDuration <= 0 ||
        !Number.isFinite(normalizedMaxSnoozes) ||
        normalizedMaxSnoozes < -1

    ) {

        throw new ExpressError(

            400,

            "Invalid preference values."

        );

    }

    const setup =
        await CompanionSettings.findOneAndUpdate(

            {

                user:
                    req.identity.userId

            },

            {

                voiceEnabled: micEnabled,

                notificationsEnabled,

                overlayEnabled,

                startupEnabled,

                checkInInterval: normalizedCheckInFrequency,

                snoozeDuration: normalizedSnoozeDuration,

                maxSnoozes: normalizedMaxSnoozes

            },

            {

                upsert: true,

                new: true,

                runValidators: true

            }

        );

    res.json({

        message:
            "Preferences updated successfully.",

        setup

    });

};

module.exports.changePassword =
async (req, res) => {

    const {

        currentPassword,

        newPassword,

        confirmPassword

    } = req.body;

    if (

        !currentPassword ||

        !newPassword ||

        !confirmPassword

    ) {

        throw new ExpressError(

            400,

            "All password fields are required."

        );

    }

    if (

        newPassword !==
        confirmPassword

    ) {

        throw new ExpressError(

            400,

            "Passwords do not match."

        );

    }

    if (

        newPassword.length < 8

    ) {

        throw new ExpressError(

            400,

            "Password must be at least 8 characters."

        );

    }

    const user =
        await User.findById(
            req.identity.userId
        );

    const isMatch =
        await bcrypt.compare(

            currentPassword,

            user.passwordHash

        );

    if (!isMatch) {

        throw new ExpressError(

            400,

            "Current password is incorrect."

        );

    }

    user.passwordHash =
        await bcrypt.hash(

            newPassword,

            10

        );

    await user.save();

    res.json({

        message:
            "Password changed successfully."

    });

};
