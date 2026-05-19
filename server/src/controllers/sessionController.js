const FocusSession =
require("../models/FocusSession");

const ExpressError =
require("../utils/ExpressError");

module.exports.startSession =
async (req, res) => {

  const {
    taskId,
    duration,
    mode
  } = req.body;

  if (
    !taskId ||
    !duration
  ) {

    throw new ExpressError(
      400,
      "Task and duration required"
    );
  }

  const session =
    await FocusSession.create({

      user: req.identity.userId,

      task: taskId,

      plannedDuration: duration,

      mode,

      status: "active",

      startedAt: new Date()

    });

  res.status(201).json({

    message:
      "Focus session started",

    session

  });

};


module.exports.completeSession =
async (req, res) => {

  const session =
    await FocusSession.findById(
      req.params.id
    );

  if (!session) {

    throw new ExpressError(
      404,
      "Session not found"
    );
  }

  session.status = "completed";

  session.endedAt =
    new Date();

  session.actualDuration =
    session.plannedDuration;

  await session.save();

  res.json({
    message:
      "Session completed",
    session
  });

};


module.exports.failSession =
async (req, res) => {

  const session =
    await FocusSession.findById(
      req.params.id
    );

  if (!session) {

    throw new ExpressError(
      404,
      "Session not found"
    );
  }

  session.status = "failed";

  session.endedAt =
    new Date();

  await session.save();

  res.json({
    message:
      "Session failed",
    session
  });

};


module.exports.snoozeSession =
async (req, res) => {

  const session =
    await FocusSession.findById(
      req.params.id
    );

  if (!session) {

    throw new ExpressError(
      404,
      "Session not found"
    );
  }

  session.status = "snoozed";

  await session.save();

  res.json({
    message:
      "Session snoozed",
    session
  });

};


/*WHAT IS HAPPENING?

User:
starts focus session.

Backend:
creates:

behavioral execution instance.
IMPORTANT DIFFERENCE

Task:

intention

Session:

actual execution

THIS distinction is foundational.
*/