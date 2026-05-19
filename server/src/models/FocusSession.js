const mongoose = require("mongoose");

const focusSessionSchema =
new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },

  mode: {
    type: String,
    enum: ["gentle", "strict"],
    default: "gentle"
  },

  plannedDuration: {
    type: Number,
    required: true
  },

  actualDuration: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: [
      "scheduled",
      "active",
      "check_in_pending",
      "completed",
      "failed",
      "snoozed"
    ],
    default: "scheduled"
  },

  startedAt: {
    type: Date,
    default: null
  },

  endedAt: {
    type: Date,
    default: null
  },

  distractionCount: {
    type: Number,
    default: 0
  },

  notes: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports =
mongoose.model(
  "FocusSession",
  focusSessionSchema
);