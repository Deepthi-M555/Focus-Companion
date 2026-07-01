const bcrypt = require("bcrypt");

const User = require("../models/User");
const Setup = require("../models/Setup");

const ExpressError = require("../utils/ExpressError");

module.exports.getSettings = async (req, res) => {

    const user = await User.findById(
        req.identity.userId
    ).select("name email");

    const setup = await Setup.findOne({
        user: req.identity.userId
    });

    res.json({

        name: user?.name || "",

        email: user.email,

        micEnabled:
            setup?.micEnabled ?? true,

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

    const { name, email } = req.body;

    if (!name || !email) {

        throw new ExpressError(
            400,
            "Name and email are required."
        );

    }

    const existingUser =
        await User.findOne({
            email
        });

    if (
        existingUser &&
        existingUser._id.toString() !==
        req.identity.userId.toString()
    ) {

        throw new ExpressError(
            400,
            "Email already exists."
        );

    }

    const user =
        await User.findByIdAndUpdate(

            req.identity.userId,

            {
                name,
                email
            },

            {
                new: true,
                runValidators: true
            }

        );

    res.json({

        message:
            "Profile updated successfully.",

        user

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

    if (

        checkInFrequency <= 0 ||

        snoozeDuration <= 0 ||

        maxSnoozes < -1

    ) {

        throw new ExpressError(

            400,

            "Invalid preference values."

        );

    }

    const setup =
        await Setup.findOneAndUpdate(

            {

                user:
                    req.identity.userId

            },

            {

                micEnabled,

                notificationsEnabled,

                overlayEnabled,

                startupEnabled,

                checkInFrequency,

                snoozeDuration,

                maxSnoozes

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