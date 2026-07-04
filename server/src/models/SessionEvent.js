const mongoose =
require("mongoose");

const sessionEventSchema =
new mongoose.Schema({

  session: {
    type:
      mongoose.Schema.Types.ObjectId,

    ref: "FocusSession",

    required: true
  },

  user: {
    type:
      mongoose.Schema.Types.ObjectId,

    ref: "User",

    required: true
  },

  type: {
    type: String,

    enum: [
      "SESSION_START",
      "CHECK_IN_TRIGGERED",
      "CHECK_IN",
      "DISTRACTION",
      "SNOOZE",
      "SESSION_COMPLETE",
      "SESSION_FAIL",
      "RECOVERY_TRIGGERED",
      "SESSION_SKIPPED",
      "SESSION_RESUMED",
      "RECOVERY_COMPLETED"
    ],

    required: true
  },

  metadata: {
    type: Object,
    default: {}
  }

}, {
  timestamps: true
});

module.exports =
mongoose.model(
  "SessionEvent",
  sessionEventSchema
);
