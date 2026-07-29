const FocusSession =
    require("../models/FocusSession");

const Task =
    require("../models/Task");

const SessionEvent =
    require("../models/SessionEvent");

const {
    logVoiceEvent
} = require("../voice/services/logger");

const {
    detectIntent,
    executeIntent
} = require("../services/intentService");

const {
    clearSessionTimer
} = require("../services/sessionTimerService");

const {
    STATES
} = require(
    "../services/focusStateMachine"
);

module.exports = (io, socket) => {

    socket.on(
        "join_focus_session",
        (sessionId) => {

            socket.join(sessionId);

        }
    );

    socket.on(
        "voice-response",

        async ({
            sessionId,
            transcript
        }) => {

            try {

                const session =
                    await FocusSession.findById(
                        sessionId
                    );

                if (!session) {
                    return;
                }

                /*
                 * Voice responses are only valid
                 * while a check-in is waiting.
                 *
                 * This prevents late/duplicate
                 * responses from modifying the
                 * session after snooze/recovery/
                 * completion.
                 */
                if (
                    session.status !==
                    STATES.CHECK_IN_PENDING
                ) {

                    console.log(
                        "Ignoring voice response. Session is not awaiting check-in:",
                        session.status
                    );

                    return;
                }

                if (
                    !transcript ||
                    !transcript.trim()
                ) {

                    io.to(sessionId).emit(
                        "focus:clarify",
                        {
                            message:
                                "I couldn't hear a response clearly."
                        }
                    );

                    return;
                }

                const aiResult =
                    await detectIntent(
                        transcript
                    );

                logVoiceEvent({
                    sessionId,
                    intent:
                        aiResult.intent,
                    transcript
                });

                const result =
                    executeIntent({
                        intent:
                            aiResult.intent,

                        currentState:
                            session.status
                    });

                await SessionEvent.create({

                    session:
                        session._id,

                    user:
                        session.user,

                    type:
                        "CHECK_IN",

                    metadata: {

                        transcript,

                        intent:
                            aiResult.intent,

                        confidence:
                            aiResult.confidence
                    }

                });

                switch (result.action) {

                    /*
                     * USER CONFIRMED COMPLETION
                     */
                    case "COMPLETE": {

                        clearSessionTimer(
                            sessionId
                        );

                        session.status =
                            result.nextState;

                        session.completedBy =
                            "USER";

                        session.endedAt =
                            new Date();

                        /*
                         * plannedDuration is the
                         * meaningful focus duration
                         * here because the focus
                         * timer already reached zero
                         * before check-in.
                         */
                        session.actualDuration =
                            session.plannedDuration;

                        await session.save();

                        await Task.findByIdAndUpdate(
                            session.task,
                            {
                                status:
                                    "completed",

                                completed:
                                    true
                            }
                        );

                        await SessionEvent.create({

                            session:
                                session._id,

                            user:
                                session.user,

                            type:
                                "SESSION_COMPLETE"
                        });

                        io.to(sessionId).emit(
                            "focus:complete",
                            {
                                sessionId
                            }
                        );

                        break;
                    }


                    /*
                     * USER EXPLICITLY NEEDS HELP
                     */
                    case "RECOVERY": {

                        clearSessionTimer(
                            sessionId
                        );

                        session.status =
                            result.nextState;

                        if (
                            session.distractionCount < 1
                        ) {
                            session.distractionCount += 1;
                        }

                        session.completedBy =
                            "RECOVERY";

                        session.endedAt =
                            new Date();

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
                            "focus:recovery",
                            {
                                sessionId
                            }
                        );

                        break;
                    }


                    /*
                     * UNKNOWN / UNCLEAR RESPONSE
                     *
                     * IMPORTANT:
                     * Do NOT clear response timer.
                     *
                     * Session remains:
                     * CHECK_IN_PENDING
                     *
                     * If the user doesn't provide
                     * a valid answer before timeout,
                     * sessionTimerService performs
                     * automatic snooze.
                     */
                    default: {

                        io.to(sessionId).emit(
                            "focus:clarify",
                            {
                                sessionId,

                                message:
                                    aiResult.reply ||
                                    "Please tell me whether you completed the task or need help."
                            }
                        );

                        break;
                    }
                }

            } catch (error) {

                console.error(
                    "Voice response error:",
                    error
                );

            }

        }
    );

};