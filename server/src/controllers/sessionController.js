const FocusSession =
require("../models/FocusSession");

const Task =
require("../models/Task");

const { Types: { ObjectId } } = require("mongoose");

const CompanionSettings =
require("../models/CompanionSettings");

const SessionEvent =
require("../models/SessionEvent");

const {
  STATES
} = require("../services/focusStateMachine");

const {
    getTaskProgress,
} = require("../services/taskService");

const {
    startSessionTimer,
    clearSessionTimer
} = require(
    "../services/sessionTimerService"
);
const {
    completeSessionAndAdvance
} = require(
    "../services/sessionCompletionService"
);
const ExpressError =
require("../utils/ExpressError");

module.exports.startSession =
async (req, res) => {
  const {
    taskId,
    mode = "gentle",
    owner = "WEB"
} = req.body;

  const sessionMode =
    mode === "strict" ? "strict" : "gentle";

  console.log("[startSession] Called by user:", req.identity.userId);
  console.log("[startSession] Request body:", { taskId, mode, owner });
  console.log("[startSession] Stack trace:", new Error().stack);

  const existingSession =
    await FocusSession.findOne({
      user: req.identity.userId,
      status: {
        $in: [
          "active",
          "paused",
          "check_in_pending",
          "snoozed",
          "recovery"
        ]
      }
    })
    .sort({ startedAt: -1 })
    .populate("task");

  console.log("[startSession] Existing session check:", {
    found: !!existingSession,
    sessionId: existingSession?._id,
    status: existingSession?.status
  });

  if (existingSession) {
    console.log("[startSession] CONFLICT - Returning 409 with existing session");
    return res.status(409).json({
      success: false,
      conflict: "ACTIVE_SESSION",
      error: {
        message: "Active session already exists"
      },
      session: existingSession
    });
  }
  const settings =
    await CompanionSettings.findOneAndUpdate(
        {
            userId: req.identity.userId
        },
        {
            $setOnInsert: {
                userId: req.identity.userId
            }
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );

    // Validate that the requested task belongs to
  // this user and is actually available to start.
  const taskQuery = {
    userId: req.identity.userId,
    archived: {
      $ne: true
    },
    status: "pending",
    completed: false
  };

  if (taskId !== undefined && taskId !== null && taskId !== "") {
    if (!ObjectId.isValid(taskId)) {
      throw new ExpressError(
        400,
        "The selected task id is invalid."
      );
    }

    taskQuery._id = taskId;
  }

  const task = await Task.findOne(
    taskQuery
  ).sort({
    sequenceOrder: 1,
    createdAt: 1
  });

  if (!task) {
    throw new ExpressError(
      400,
      taskId
        ? "The selected task is not available to start."
        : "No pending task is available to start."
    );
  }
  const scheduleTasks = await Task.find({
    userId: req.identity.userId,
    archived: {
        $ne: true
    },
    completed: false,
    status: {
        $in: ["pending", "in_progress"]
    }
  });

  const totalPlannedMinutes =
      scheduleTasks.reduce(
          (sum, item) =>
              sum + Number(item.estimatedDuration || 0),
          0
      );
    const plannedMinutes = Math.max(
        1,
        Math.floor(Number(task.estimatedDuration) || 1)
    );

    const session =
    await FocusSession.create({
        user: req.identity.userId,
        task: task._id,

        plannedDuration:
            plannedMinutes,

        remainingDuration:
            plannedMinutes,

        originalPlannedMinutes:
            totalPlannedMinutes,

        totalPlannedMinutes:
            totalPlannedMinutes,

        originalTaskCount:
            scheduleTasks.length,

        mode: sessionMode,
        owner,

        status: STATES.ACTIVE,
        startedAt: new Date(),

        voiceResponseTimeout:
            settings.voiceResponseTimeout,

        snoozeDuration:
            settings.snoozeDuration,

        maxSnoozes:
            settings.maxSnoozes,

        snoozeCount: 0
    });

    console.log("[startSession] ===== SESSION CREATED =====");
    console.log("[startSession] New session:", {
      _id: session._id,
      user: session.user,
      task: session.task,
      status: session.status,
      plannedDuration: session.plannedDuration,
      remainingDuration: session.remainingDuration,
      startedAt: session.startedAt,
      mode: session.mode,
      requestOwner: owner
    });

    await Task.findByIdAndUpdate(
      task._id,
      {
        status:
          "in_progress"
      }
    );

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
    plannedMinutes
);

  res.status(201).json({
    message:
      "Focus session started",
    session
  });
};

module.exports.failSession =
async (req, res) => {

  const owner =
    req.body.owner || "WEB";

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

  if (
    session.owner === "DESKTOP" &&
    owner !== "DESKTOP"
  ) {
    throw new ExpressError(
      409,
      "Session is controlled by the desktop client"
    );
  }

  /*
   * Manual End Session is a terminal action.
   * It must NOT remain resumable.
   */
  session.status = "skipped";
  session.completedBy = "USER";
  session.endedAt = new Date();

  await session.save();

  await Task.findByIdAndUpdate(
    session.task,
    {
      status: "skipped",
      completed: false
    }
  );

  clearSessionTimer(
    session._id.toString()
  );

  await SessionEvent.create({
    session: session._id,
    user: session.user,
    type: "SESSION_SKIPPED",
    metadata: {
      reason: "SESSION_ENDED_BY_USER",
      endedAt: new Date()
    }
  });

  const io =
    req.app.get("io");

  io.to(
    session._id.toString()
  ).emit(
    "focus:ended",
    {
      sessionId:
        session._id.toString()
    }
  );

  res.json({
    message: "Session ended",
    session
  });
};


const computeRemainingDuration = (session) => {
  if (!session) return null;
  const baseDuration = Number(
    session.remainingDuration != null
      ? session.remainingDuration
      : session.plannedDuration
  );

  if (!Number.isFinite(baseDuration)) {
    return 0;
  }

  if (session.status === "paused") {
    return Math.max(0, Math.round(baseDuration));
  }

  if (
    session.status === "check_in_pending" ||
    session.status === "snoozed" ||
    session.status === "recovery"
  ) {
    return 0;
  }

  if (session.startedAt) {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
    );
    const remainingSeconds = Math.max(0, baseDuration * 60 - elapsedSeconds);
    return Math.max(0, Math.ceil(remainingSeconds / 60));
  }

  return Math.max(0, Math.round(baseDuration));
};

module.exports.resumeSession  =
async (req,res)=>{
    console.log("[resumeSession] Called by user:", req.identity.userId);
    
    const session =
        await FocusSession.findOne({
            user: req.identity.userId,
            status:{
                $in:[
                    "active",
                    "paused",
                    "check_in_pending",
                    "snoozed",
                    "recovery"
                ]
            }
        })
        .sort({ startedAt: -1 })
        .populate("task");

        console.log("[resumeSession] Query result:", {
          found: !!session,
          sessionId: session?._id,
          status: session?.status,
          plannedDuration: session?.plannedDuration,
          remainingDuration: session?.remainingDuration,
          startedAt: session?.startedAt
        });

        let progress = {
          currentTaskIndex: 1,
          totalTasks: 1
        };

      if (session) {
          session.remainingDuration =
              computeRemainingDuration(session);

          console.log("[resumeSession] Computed remaining duration:", session.remainingDuration);

          progress = await getTaskProgress(
              req.identity.userId,
              session.task._id
          );
      } else {
          console.log("[resumeSession] No active session found for user", req.identity.userId);
      }

      res.json({
          session,
          currentTaskIndex:
              progress.currentTaskIndex,
          totalTasks:
              progress.totalTasks
      });
};

module.exports.pauseSession =
async (req,res)=>{

  const owner = req.body.owner || "WEB";

  const session = await FocusSession.findOne({
    _id: req.params.id,
    user: req.identity.userId
  });

  if(!session){
    throw new ExpressError(
    404,
    "Session not found"
    );
  }

if (session.owner === "DESKTOP" && owner !== "DESKTOP") {
  throw new ExpressError(
  409,
  "Session is controlled by the desktop client"
  );
}
if (session.status !== STATES.ACTIVE) {
  throw new ExpressError(
    409,
    "Only an active session can be paused."
  );
}

const elapsedMinutes = session.startedAt
  ? Math.max(
      0,
      (Date.now() - session.startedAt.getTime()) / 60000
    )
  : 0;

const baseDuration =
  session.remainingDuration != null
    ? session.remainingDuration
    : session.plannedDuration;

const remaining = Math.max(
  0,
  baseDuration - elapsedMinutes
);

session.remainingDuration = remaining;
session.status = "paused";
await session.save();

clearSessionTimer(

session._id.toString()

);

await SessionEvent.create({

session:session._id,

user:session.user,

type:"SESSION_PAUSED",
metadata:{
  remainingDuration: remaining
}

});

res.json({

message:"Paused",

session

});

};

module.exports.resumePausedSession =
async (req, res) => {

    const owner =
        req.body.owner || "WEB";

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

    if (
        session.owner === "DESKTOP" &&
        owner !== "DESKTOP"
    ) {

        throw new ExpressError(
            409,
            "Session is controlled by the desktop client"
        );

    }

    if (
        session.status !==
        STATES.PAUSED
    ) {

        throw new ExpressError(
            409,
            "Only a paused session can be resumed."
        );

    }

    const remaining =
        Math.max(
            0,
            session.remainingDuration != null
                ? session.remainingDuration
                : session.plannedDuration
        );

    session.status =
        STATES.ACTIVE;

    session.startedAt =
        new Date();

    session.remainingDuration =
        remaining;

    await session.save();

    const io =
        req.app.get("io");

    startSessionTimer(
        io,
        session._id.toString(),
        remaining
    );

    await SessionEvent.create({

        session:
            session._id,

        user:
            session.user,

        type:
            "SESSION_RESUMED",

        metadata: {
            remainingDuration:
                remaining
        }

    });

    res.json({

        message:
            "Resumed",

        session

    });

};

module.exports.completeSession =
async (req, res) => {

    const owner =
        req.body.owner || "WEB";

    const result =
        await completeSessionAndAdvance({
            userId:
                req.identity.userId,

            sessionId:
                req.params.id,

            owner,

            io:
                req.app.get("io")
        });

    res.json({
        success: true,
        ...result
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
