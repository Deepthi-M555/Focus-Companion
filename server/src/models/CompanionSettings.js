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

                "STRICT",

                "GENTLE",

                "MOTIVATIONAL",

                "ANALYTICAL"

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