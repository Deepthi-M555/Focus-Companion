const Task = require("../models/Task");
const ExpressError = require("../utils/ExpressError");

// CREATE TASK
module.exports.createTask = async (req, res) => {
  const { title, duration, priority } = req.body;

  // Validation
  if (!title || !duration) {
    throw new ExpressError(400, "Title and duration are required");
  }

  if (duration <= 0) {
    throw new ExpressError(400, "Duration must be greater than 0");
  }

  const newTask = new Task({
    title,
    duration,
    priority,
    user: req.user._id
  });

  await newTask.save();

  res.status(201).json({
    message: "Task created",
    task: newTask
  });
};


// GET TASKS
module.exports.getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user._id })
    .select("title duration priority createdAt");

  res.json({ tasks });
};


// DELETE TASK (optimized with step 6)
module.exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  const deletedTask = await Task.findOneAndDelete({
    _id: id,
    user: req.user._id
  });

  if (!deletedTask) {
    throw new ExpressError(404, "Task not found or not authorized");
  }

  res.json({ message: "Task deleted" });
};


// UPDATE TASK
module.exports.updateTask = async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);

  if (!task) {
    throw new ExpressError(404, "Task not found");
  }

  if (task.user.toString() !== req.user._id.toString()) {
    throw new ExpressError(403, "Not authorized");
  }

  const updatedTask = await Task.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    message: "Task updated",
    task: updatedTask
  });
};