const FocusSession =
require("../models/FocusSession");

const SessionEvent =
require("../models/SessionEvent");

const {
    startSessionTimer,
    clearSessionTimer
} = require(
    "../services/sessionTimerService"
);

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
    await SessionEvent.create({
    session: session._id,
    user: req.identity.userId,
    type: "SESSION_START"
});
const io = req.app.get("io");
clearSessionTimer(
    session._id.toString()
);
startSessionTimer(
    io,
    session._id.toString(),
    duration
);

  res.status(201).json({
    message:
      "Focus session started",
    session
  });
};

module.exports.completeSession =
async (req, res) => {
  const session =
    await FocusSession.findOne({
        _id: req.params.id,
        user: req.identity.userId
    });

  if (!session) {
    throw new ExpressError(
      404,
      "Session not found"
    );
  }
  session.status = "completed";
  session.endedAt = new Date();
  const actualDuration = Math.floor(
    (Date.now() -
    session.startedAt.getTime()) /
    60000
);
session.actualDuration = actualDuration;
  await session.save();

  clearSessionTimer(
      session._id.toString()
  );
  await SessionEvent.create({
      session: session._id,
      user: session.user,
      type: "SESSION_COMPLETE",
      metadata: {
          actualDuration,
          completedAt:
              new Date()
      }
  });

  res.json({
    message:
      "Session completed",
    session
  });
};


module.exports.failSession =
async (req, res) => {
    const session =
      await FocusSession.findOne({
          _id: req.params.id,
          user: req.identity.userId
      });
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
  clearSessionTimer(
      session._id.toString()
  );

  await SessionEvent.create({
      session: session._id,
      user: session.user,
      type: "SESSION_FAIL",
      metadata: {
        failedAt:
            new Date()
      }
  });

  res.json({
    message:
      "Session failed",
    session
  });
};


module.exports.snoozeSession =
async (req, res) => {
    const session =
      await FocusSession.findOne({
          _id: req.params.id,
          user: req.identity.userId
      });

  if (!session) {
    throw new ExpressError(
      404,
      "Session not found"
    );
  }
  session.status = "snoozed";
  await session.save();
  clearSessionTimer(
      session._id.toString()
  );
  await SessionEvent.create({
      session: session._id,
      user: session.user,
      type: "SNOOZE",
      metadata: {
        snoozedAt:
            new Date()
      }
  });
  res.json({
    message:
      "Session snoozed",
    session
  });
};

module.exports.resumeActiveSession =
async (req,res)=>{
    const session =
        await FocusSession.findOne({
            user:req.identity.userId,
            status:{
                $in:[
                    "active",
                    "check_in_pending",
                    "snoozed"
                ]
            }
        }).populate("task");
    res.json({
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