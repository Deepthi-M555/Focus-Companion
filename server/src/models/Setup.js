const mongoose = require("mongoose");

const setupSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        micEnabled: {
            type: Boolean,
            default: true
        },

        notificationsEnabled: {
            type: Boolean,
            default: true
        },

        overlayEnabled: {
            type: Boolean,
            default: true
        },

        checkInFrequency: {
            type: Number,
            required: true
        },

        snoozeDuration: {
            type: Number,
            required: true
        },

        maxSnoozes: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Setup",
    setupSchema
);