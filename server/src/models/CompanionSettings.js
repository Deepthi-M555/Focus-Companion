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
    voiceResponseTimeout: {
        type: Number,
        default: 60,
        min: 1
    },
    snoozeDuration: {
        type: Number,
        default: 5
    },
    maxSnoozes: {
        type: Number,
        default: 3,
        min: 1,
        max: 5
    },
    overlayEnabled:{
    type:Boolean,
    default:true
    },

    startupEnabled:{
    type:Boolean,
    default:false
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
    "CompanionSettings", companionSettingsSchema
);
