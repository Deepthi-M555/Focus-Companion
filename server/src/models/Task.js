const mongoose =require("mongoose");

const taskSchema =new mongoose.Schema({
  userId: {
    type:
      mongoose.Schema.Types.ObjectId,
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

  estimatedDuration: {
    type: Number,
    required: true
  },

  priority: {
    type: Number,
    default: 1
  },

  type: {
    type: String,

    enum: [
      "ELASTIC",
      "INELASTIC"
    ],

    default: "ELASTIC"
  },

  fixedStartTime: {
    type: Date,
    default: null
  },

  fixedEndTime: {
    type: Date,
    default: null
  },

  status: {
    type: String,

    enum: [
      "pending",
      "in_progress",
      "completed",
      "skipped"
    ],

    default: "pending"
  },

  completed: {
    type: Boolean,
    default: false
  },
  precedingTaskId: {

  type:
    mongoose.Schema.Types.ObjectId,

  ref: "Task",

  default: null
},
sequenceOrder: {
  type: Number,
  default: 0
},

isLocked: {
  type: Boolean,
  default: false
},

archived: {
  type: Boolean,
  default: false
}

}, {
  timestamps: true
});

module.exports =mongoose.model("Task",taskSchema);
