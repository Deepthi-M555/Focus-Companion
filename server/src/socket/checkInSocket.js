const FocusSession = require("../models/FocusSession");
const Task = require("../models/Task");
const SessionEvent = require("../models/SessionEvent");
const { logVoiceEvent } = require("../voice/services/logger");

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

                const aiResult=
                await detectIntent(transcript);

                logVoiceEvent({
                sessionId,
                intent:aiResult.intent,
                transcript
                });
                
                const result=
                executeIntent({
                intent:aiResult.intent,
                currentState:session.status
                });

                await SessionEvent.create({

                    session:session._id,

                    user:session.user,

                    type:"CHECK_IN",

                    metadata:{

                    transcript,

                    intent:aiResult.intent,

                    confidence:aiResult.confidence

                    }

                });

                switch(result.action){

                    case "COMPLETE":

                        session.status=
                            result.nextState;

                        session.completedBy="USER";

                        session.endedAt=new Date();

                        const elapsedMinutes = session.startedAt
                            ? Math.max(0, Math.floor((Date.now() - session.startedAt.getTime()) / 60000))
                            : 0;

                        session.actualDuration = elapsedMinutes;

                        await session.save();

                        await Task.findByIdAndUpdate(
                            session.task,
                            {
                                status: "completed",
                                completed: true
                            }
                        );

                        await SessionEvent.create({

                            session:session._id,

                            user:session.user,

                            type:"SESSION_COMPLETE"

                        });

                        io.to(sessionId).emit(
                        "focus:complete"
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

                            if (session.distractionCount < 1) {
                                session.distractionCount += 1;
                            }

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

                                "focus:recovery"

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
                        aiResult.duration||
                        settings?.snoozeDuration||
                        10
                        );

                        io.to(sessionId).emit(

                            "focus:snooze"

                        );

                        break;

                    case "RECOVERY":

                        session.status=
                            result.nextState;

                        if (session.distractionCount < 1) {
                            session.distractionCount += 1;
                        }

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

                            "focus:recovery"

                        );

                        break;

                    default:

                        io.to(sessionId).emit(

                            "focus:continue"

                        );

                }

            }

            catch(error){

                console.error(error);

            }

        }

    );

};
