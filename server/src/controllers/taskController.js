const Task =
require("../models/Task");

const ExpressError =
require("../utils/ExpressError");

module.exports.createTask =
async (req, res) => {

  const {
    title,
    description,
    priority,
    estimatedDuration
  } = req.body;

  if (
    !title ||
    !estimatedDuration
  ) {

    throw new ExpressError(
      400,
      "Title and duration required"
    );

  }

  const task =
    await Task.create({

      user:
        req.identity.userId,

      title,
      description,
      priority,
      estimatedDuration

    });

  res.status(201).json({

    message: "Task created",task

  });

};