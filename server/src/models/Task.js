const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    default: ""
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },

  estimatedDuration: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: [
      "pending",
      "in_progress",
      "completed"
    ],
    default: "pending"
  },

  isFixed: {
    type: Boolean,
    default: false
  },

  scheduledFor: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports =
mongoose.model("Task", taskSchema);



// WHAT IS HAPPENING HERE?
// user

// Links task to owner.

// VERY important for:

// analytics
// authorization
// personalization
// estimatedDuration

// Stored in:

// minutes

// NOT hours.

// Why?

// Because:

// smaller units give scheduling precision.
// isFixed

// THIS is important for Phase 3.

// Example:

// Fixed
// college class
// meeting
// sleep

// Cannot move.

// Flexible
// study session
// revision
// practice

// Can move dynamically.

// This is:

// future scheduling intelligence foundation.