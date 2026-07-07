const FocusSession =
require("../models/FocusSession");

const CompanionSettings =
require("../models/CompanionSettings");

const SessionEvent =
require("../models/SessionEvent");

const {
    STATES,
    transition
} = require(
    "./focusStateMachine"
);

const activeTimers =
new Map();

const startSessionTimer =
async (

    io,

    sessionId,

    duration

) => {

    clearSessionTimer(sessionId);

    const session =
        await FocusSession
        .findById(sessionId)
        .populate("user");

    if(!session){

        return;

    }

    const settings =
        await CompanionSettings
        .findOne({

            userId:
                session.user

        });

    const interval = duration;

    const timer =

        setTimeout(

            async()=>{

                try{

                    const currentSession =
                        await FocusSession.findById(
                            sessionId
                        );

                    if (!currentSession) {
                        activeTimers.delete(sessionId);
                        return;
                    }

                    currentSession.status =
                        transition({
                            currentState:
                                currentSession.status,
                            nextState:
                                STATES.CHECK_IN_PENDING
                        });
                    currentSession.remainingDuration = 0;

                    await currentSession.save();

                    await SessionEvent.create({

                        session:
                            session._id,

                        user:
                            session.user._id,

                        type:
                            "CHECK_IN_TRIGGERED"

                    });

                    io.to(sessionId).emit(

                        "show-check-in",

                        {

                            sessionId,

                            personality:

                                settings?.personality ??

                                "GENTLE",

                            timeout:

                                settings?.voiceResponseTimeout ??

                                60,

                            maxSnoozes:

                                settings?.maxSnoozes ??

                                3,

                            snoozeDuration:

                                settings?.snoozeDuration ??

                                10

                        }

                    );

                    const voiceResponseTimeout =
                        settings?.voiceResponseTimeout ?? 60;

                    const responseTimer =
                        setTimeout(
                            async () => {
                                try {
                                    const pendingSession =
                                        await FocusSession.findById(
                                            sessionId
                                        );

                                    if (
                                        !pendingSession ||
                                        pendingSession.status !==
                                            STATES.CHECK_IN_PENDING
                                    ) {
                                        return;
                                    }

                                    pendingSession.status =
                                        transition({
                                            currentState:
                                                pendingSession.status,
                                            nextState:
                                                STATES.RECOVERY_ENGINE
                                        });

                                    if (
                                        pendingSession.distractionCount < 1
                                    ) {
                                        pendingSession.distractionCount += 1;
                                    }

                                    pendingSession.completedBy =
                                        "RECOVERY";

                                    await pendingSession.save();

                                    await SessionEvent.create({
                                        session:
                                            pendingSession._id,
                                        user:
                                            pendingSession.user,
                                        type:
                                            "RECOVERY_TRIGGERED",
                                        metadata: {
                                            reason:
                                                "VOICE_TIMEOUT"
                                        }
                                    });

                                    io.to(sessionId).emit(
                                        "go-recovery",
                                        { sessionId }
                                    );
                                } catch (error) {
                                    console.error(error);
                                } finally {
                                    activeTimers.delete(sessionId);
                                }
                            },
                            voiceResponseTimeout * 1000
                        );

                    activeTimers.set(
                        sessionId,
                        responseTimer
                    );

                }

                catch(error){

                    console.error(

                        error

                    );

                    activeTimers.delete(
                        sessionId
                    );

                }

            },

            interval *

            60 *

            1000

        );

    activeTimers.set(

        sessionId,

        timer

    );

};

const clearSessionTimer =
(sessionId)=>{

    const timer=

    activeTimers.get(

        sessionId

    );

    if(timer){

        clearTimeout(

            timer

        );

        activeTimers.delete(

            sessionId

        );

    }

};

module.exports={

    startSessionTimer,

    clearSessionTimer

};
