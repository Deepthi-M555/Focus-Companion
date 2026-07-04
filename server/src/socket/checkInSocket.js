const FocusSession = require("../models/FocusSession");
const SessionEvent = require("../models/SessionEvent");

const {
    detectIntent,
    executeIntent
} = require("../services/intentService");

const {
    startSessionTimer,
    clearSessionTimer
} = require("../services/sessionTimerService");

const CompanionSettings =
require("../models/CompanionSettings");

const {
    STATES,
    transition
} = require(
    "../services/focusStateMachine"
);

module.exports = (io, socket) => {

    socket.on("join_focus_session", (sessionId) => {

        socket.join(sessionId);

    });

    socket.on(

        "voice-response",

        async ({

            sessionId,

            transcript

        }) => {

            try{

                const session =
                await FocusSession.findById(sessionId);

                if(!session){

                    return;

                }

                clearSessionTimer(sessionId);

                const settings =
                await CompanionSettings.findOne({

                    userId:session.user

                });

                const intent =
                detectIntent(transcript);

                const result =
                executeIntent({

                    intent,

                    currentState:
                        session.status

                });

                await SessionEvent.create({

                    session:session._id,

                    user:session.user,

                    type:"CHECK_IN",

                    metadata:{

                        transcript,

                        intent

                    }

                });

                switch(result.action){

                    case "COMPLETE":

                        session.status=
                            result.nextState;

                        session.completedBy="USER";

                        session.endedAt=new Date();

                        session.actualDuration=session.plannedDuration;

                        await session.save();

                        await SessionEvent.create({

                            session:session._id,

                            user:session.user,

                            type:"SESSION_COMPLETE"

                        });

                        io.to(sessionId).emit(

                            "session-completed"

                        );

                        break;

                    case "SNOOZE":

                        session.snoozeCount += 1;

                        if(

                            session.snoozeCount >=

                            (settings?.maxSnoozes ?? 3)

                        ){

                            session.status =
                                transition({
                                    currentState:
                                        session.status,
                                    nextState:
                                        STATES.RECOVERY_ENGINE
                                });

                            session.completedBy =
                                "RECOVERY";

                            await session.save();

                            await SessionEvent.create({
                                session:
                                    session._id,
                                user:
                                    session.user,
                                type:
                                    "RECOVERY_TRIGGERED",
                                metadata: {
                                    reason:
                                        "MAX_SNOOZE_REACHED",
                                    snoozeCount:
                                        session.snoozeCount
                                }
                            });

                            io.to(sessionId).emit(

                                "go-recovery",
                                { sessionId }

                            );

                            return;

                        }

                        session.status =
                            result.nextState;

                        await session.save();

                        await SessionEvent.create({
                            session:
                                session._id,
                            user:
                                session.user,
                            type:
                                "SNOOZE",
                            metadata: {
                                snoozeCount:
                                    session.snoozeCount
                            }
                        });

                        startSessionTimer(

                            io,

                            sessionId,

                            settings?.snoozeDuration ?? 10

                        );

                        io.to(sessionId).emit(

                            "session-snoozed"

                        );

                        break;

                    case "RECOVERY":

                        session.status=
                            result.nextState;

                        session.completedBy="RECOVERY";

                        session.endedAt=new Date();

                        await session.save();

                        await SessionEvent.create({
                            session:
                                session._id,
                            user:
                                session.user,
                            type:
                                "RECOVERY_TRIGGERED",
                            metadata: {
                                reason:
                                    "NEED_HELP"
                            }
                        });

                        io.to(sessionId).emit(

                            "go-recovery",
                            { sessionId }

                        );

                        break;

                    default:

                        io.to(sessionId).emit(

                            "listen-again"

                        );

                }

            }

            catch(error){

                console.error(error);

            }

        }

    );

};
