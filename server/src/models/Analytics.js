const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    plannedMinutes: {
        type: Number,
        default: 0
    },

    focusedMinutes: {
        type: Number,
        default: 0
    },

    completedSessions: {
        type: Number,
        default: 0
    },

    distractionCount: {
        type: Number,
        default: 0
    },

    focusIntegrityScore: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

analyticsSchema.index(
    {
        userId: 1,
        date: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "Analytics",
    analyticsSchema
);