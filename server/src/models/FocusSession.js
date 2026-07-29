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

  remainingDuration: {
    type: Number,
    default: null
  },

  originalPlannedMinutes: {
    type: Number,
    default: 0
  },

  totalPlannedMinutes: {
    type: Number,
    default: 0
  },

  scheduleGeneratedAt: {
    type: Date,
    default: Date.now
  },

  originalTaskCount: {
    type: Number,
    default: 0
  },

  extraMinutesAdded: {
    type: Number,
    default: 0
  },

  owner: {
    type: String,
    enum: ["WEB", "DESKTOP"],
    default: "WEB"
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
      "paused",
      "check_in_pending",
      "snoozed",
      "recovery",
      "completed",
      "skipped"
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

  snoozeCount: {
      type: Number,
      default: 0
  },

  voiceResponseTimeout: {
      type: Number,
      default: 60,
      min: 1
  },

  snoozeDuration: {
      type: Number,
      default: 5,
      min: 1
  },

  maxSnoozes: {
      type: Number,
      default: 3,
      min: 1,
      max:5
  },

  notes: {
    type: String,
    default: ""
  },
  completedBy: {
      type: String,
      enum: [
          "USER",
          "RECOVERY",
          "SYSTEM"
      ],
      default: null,
  },
  lastHeartbeatAt:{
    type:Date,
    default:null

  },

}, { timestamps: true });

module.exports =
mongoose.model(
  "FocusSession",
  focusSessionSchema
);
