const Task =
require("../models/Task");

const FocusSession =
require("../models/FocusSession");

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
    userId: req.identity.userId,
      title,
      description,
      priority,
      estimatedDuration

    });

  res.status(201).json({

    message: "Task created",task

  });

};

const{
saveSchedule,
loadTodaySchedule,
}=require("../services/taskService");

module.exports.saveSchedule =
async (
    req,
    res
) => {
    const activeSession =
        await FocusSession.findOne({
            user:
                req.identity.userId,

            status: {
                $in: [
                    "active",
                    "paused",
                    "check_in_pending",
                    "snoozed",
                    "recovery"
                ]
            }
        }).populate("task");

    if (activeSession) {
        throw new ExpressError(
            409,
            "Finish or the current focus session before replacing the timetable."
        );
    }

    const savedTasks =
        await saveSchedule({
            userId:
                req.identity.userId,
            tasks:
                req.body.tasks
        });
    res.json({
        message:
            "Timetable saved.",
        tasks:
            savedTasks
    });
};

module.exports.loadSchedule =
async (
    req,
    res
) => {
    const tasks=
    await loadTodaySchedule(
    req.identity.userId
    );
    res.json({
        schedule:
            tasks
    });
};
