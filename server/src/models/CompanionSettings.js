const mongoose =
require("mongoose");

const companionSettingsSchema =
new mongoose.Schema({

    userId: {

        type:
            mongoose.Schema.Types.ObjectId,

        ref:
            "User",

        required:
            true

    },

    personality: {

        type:
            String,

        enum: [

            "GENTLE",

            "STRICT"

        ],

        default:
            "GENTLE"

    },

    voiceEnabled: {

        type:
            Boolean,

        default:
            true

    },

    notificationsEnabled: {

        type:
            Boolean,

        default:
            true

    },

    checkInInterval: {

        type:
            Number,

        default:
            15

    },

    voiceResponseTimeout: {

        type:
            Number,

        default:
            60

    },

    snoozeDuration: {

        type:
            Number,

        default:
            10

    },

    maxSnoozes: {
        type:
            Number,
        default:
            3
    }

}, {

    timestamps: true

});

companionSettingsSchema.index(
    { userId: 1 },
    { unique: true }
);

module.exports =
mongoose.model(

    "CompanionSettings",

    companionSettingsSchema

);
