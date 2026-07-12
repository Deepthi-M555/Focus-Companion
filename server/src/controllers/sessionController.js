const FocusSession =
require("../models/FocusSession");

const Task =
require("../models/Task");

const CompanionSettings =
require("../models/CompanionSettings");

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
    mode,
    owner = "WEB"
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
  console.log("Logged in user:", req.identity.userId);

  const existingSession = await FocusSession.findOne({
    user: req.identity.userId,
    status: {
      $in: ["active", "paused", "check_in_pending", "snoozed"]
    }
  })
    .sort({ startedAt: -1 })
    .populate("task");

  console.log("Existing session:", existingSession);

  if (existingSession) {
    return res.status(409).json({
      success: false,
      conflict: "ACTIVE_SESSION",
      error: {
        message: "Active session already exists"
      },
      session: existingSession
    });
  }

  const session =
    await FocusSession.create({
      user: req.identity.userId,
      task: taskId,
      plannedDuration: duration,
      remainingDuration: duration,
      mode,
      owner,
      status: "active",
      startedAt: new Date()
    });

    console.log("SESSION CREATED");
    console.log(session);

    await Task.findByIdAndUpdate(
      taskId,
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
    duration
);

  res.status(201).json({
    message:
      "Focus session started",
    session
  });
};

module.exports.failSession =
async (req, res) => {
    const owner = req.body.owner || "WEB";
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

  if (session.owner === "DESKTOP" && owner !== "DESKTOP") {
    throw new ExpressError(
      409,
      "Session is controlled by the desktop client"
    );
  }

  session.status = "recovery";
  session.completedBy = "SYSTEM";
  session.endedAt =
    new Date();
  await session.save();

  await Task.findByIdAndUpdate(
      session.task,
      {
          status: "skipped"
      }
  );

  clearSessionTimer(
      session._id.toString()
  );

  await SessionEvent.create({
      session: session._id,
      user: session.user,
      type: "RECOVERY_TRIGGERED",
      metadata: {
        reason: "SESSION_ENDED_BY_USER",
        endedAt: new Date()
      }
  });

  const io = req.app.get("io");

const room = io.sockets.adapter.rooms.get(session._id.toString());

console.log("ROOM MEMBERS:", room);
console.log("EMITTING focus:complete");

io.to(session._id.toString()).emit("focus:complete");

res.json({
  message: "Session ended",
  session
});
};


module.exports.snoozeSession =
async (req,res)=>{

    const session =
    await FocusSession.findById(
        req.params.id
    );

    if(!session){

        throw new ExpressError(
            404,
            "Session not found"
        );

    }

    const settings =
    await CompanionSettings.findOne({

        userId:
        session.user

    });

    const maxSnoozes = settings?.maxSnoozes ?? 3;

    session.snoozeCount += 1;

    if(
        maxSnoozes !== -1 &&
        session.snoozeCount >= maxSnoozes
    ){

        session.status = "recovery";

        session.completedBy = "RECOVERY";

        session.endedAt = new Date();

        await session.save();

        clearSessionTimer(

            session._id.toString()

        );

        await SessionEvent.create({

            session:
            session._id,

            user:
            session.user,

            type:
            "RECOVERY_TRIGGERED",

            metadata:{

                reason:
                "MAX_SNOOZE_REACHED"

            }

        });

        return res.json({

            action:"RECOVERY",

            session

        });

    }

    session.status="snoozed";

    await session.save();

    clearSessionTimer(

        session._id.toString()

    );

    await SessionEvent.create({

        session:
        session._id,

        user:
        session.user,

        type:
        "SNOOZE",

        metadata:{

            snoozeCount:
            session.snoozeCount

        }

    });

    res.json({

        action:"SNOOZE",

        session

    });

};

const computeRemainingDuration = (session) => {
  if (!session) return null;
  const baseDuration =
    session.remainingDuration != null
      ? session.remainingDuration
      : session.plannedDuration;

  if (session.status === "paused") {
    return baseDuration;
  }

  if (session.status === "check_in_pending") {
    return 0;
  }

  if (session.startedAt && Number.isFinite(baseDuration)) {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
    );
    return Math.max(0, Math.round(baseDuration * 60 - elapsedSeconds) / 60);
  }

  return baseDuration;
};

module.exports.resumeActiveSession =
async (req,res)=>{
    const session =
        await FocusSession.findOne({
            user: req.identity.userId,
            status:{
                $in:[
                    "active",
                    "paused",
                    "check_in_pending",
                    "snoozed"
                ]
            }
        })
        .sort({ startedAt: -1 })
        .populate("task");

    if (session) {
      session.remainingDuration = computeRemainingDuration(session);
    }

    res.json({
        session
    });
};

module.exports.pauseSession =

async (req,res)=>{

const owner = req.body.owner || "WEB";

const session =

await FocusSession.findById(

req.params.id

);

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

module.exports.resumePausedSession=

async(req,res)=>{

const owner = req.body.owner || "WEB";

const session=

await FocusSession.findById(

req.params.id

);

if(!session){
  throw new ExpressError(404, "Session not found");
}

if (session.owner === "DESKTOP" && owner !== "DESKTOP") {

throw new ExpressError(

409,

"Session is controlled by the desktop client"

);

}

const remaining = Math.max(
  0,
  session.remainingDuration != null
    ? session.remainingDuration
    : session.plannedDuration
);

session.status="active";
session.startedAt = new Date();
session.remainingDuration = remaining;
await session.save();

const io=

req.app.get("io");

startSessionTimer(

io,

session._id.toString(),

remaining

);

await SessionEvent.create({

session:session._id,

user:session.user,

type:"SESSION_RESUMED",
metadata:{ remainingDuration: remaining }

});

res.json({

message:"Resumed",

session

});

};

module.exports.skipSession=

async(req,res)=>{

const session=

await FocusSession.findById(

req.params.id

);

session.status="skipped";

session.completedBy="SYSTEM";

session.endedAt=new Date();

await session.save();

await Task.findByIdAndUpdate(

session.task,

{

status:"skipped"

}

);

clearSessionTimer(

session._id.toString()

);

await SessionEvent.create({

session:session._id,

user:session.user,

type:"SESSION_SKIPPED"

});

res.json({

message:"Skipped"

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
