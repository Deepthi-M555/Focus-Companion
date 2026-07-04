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

  await Task.findByIdAndUpdate(

      session.task,

      {

          status:
          "completed",

          completed:true

      }

  );

  clearSessionTimer(
      session._id.toString()
  );

  await SessionEvent.create({

      session:
      session._id,

      user:
      session.user,

      type:
      "SESSION_COMPLETE",

      metadata:{

          actualDuration,

          completedAt:new Date()

      }

  });

  res.json({

      action:"COMPLETE",

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

    session.snoozeCount += 1;

    if(

        session.snoozeCount >=

        settings.maxSnoozes

    ){

        session.status = "failed";

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
            "SESSION_FAIL",

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

module.exports.pauseSession =

async (req,res)=>{

const session=

await FocusSession.findById(

req.params.id

);

if(!session){

throw new ExpressError(

404,

"Session not found"

);

}

session.status="paused";

await session.save();

clearSessionTimer(

session._id.toString()

);

await SessionEvent.create({

session:session._id,

user:session.user,

type:"SESSION_PAUSED"

});

res.json({

message:"Paused",

session

});

};

module.exports.resumePausedSession=

async(req,res)=>{

const session=

await FocusSession.findById(

req.params.id

);

session.status="active";

await session.save();

const io=

req.app.get("io");

startSessionTimer(

io,

session._id.toString(),

session.plannedDuration

);

await SessionEvent.create({

session:session._id,

user:session.user,

type:"SESSION_RESUMED"

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

session.status="completed";

session.completedBy="SYSTEM";

session.endedAt=new Date();

await session.save();

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
