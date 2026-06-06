const mongoose =
require("mongoose");

const analyticsSchema =
new mongoose.Schema({

  userId: {

    type:
      mongoose.Schema.Types.ObjectId,

    ref: "User",

    required: true
  },

  focusIntegrityScore: {
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

  totalFocusedMinutes: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

module.exports =
mongoose.model(
  "Analytics",
  analyticsSchema
);