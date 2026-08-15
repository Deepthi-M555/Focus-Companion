const FocusSession =
    require("../models/FocusSession");

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

const {
    completeSessionAndAdvance
} = require(
    "../services/sessionCompletionService"
);

module.exports = (io, socket) => {

    socket.on(
        "join_focus_session",
        async (sessionId) => {

            try {
                const session = await FocusSession.findById(sessionId);

                if (!session || String(session.user) !== String(socket.user.userId)) {
                    return;
                }

                socket.join(sessionId);
            } catch (error) {
                console.error("Unable to join focus session:", error);
            }

        }
    );

    socket.on(
        "voice-response",

        async ({
            sessionId,
            transcript
        }) => {

            try {
                const session = await FocusSession.findById(sessionId);

                if (!session || String(session.user) !== String(socket.user.userId)) {
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

                    await SessionEvent.create({

                        session:
                            session._id,

                        user:
                            session.user,

                        type:
                            "VOICE_RESPONSE_REJECTED",

                        metadata: {
                            reason:
                                "SESSION_NOT_WAITING_FOR_CHECK_IN",

                            sessionStatus:
                                session.status
                        }

                    });

                    return;
                }

                if (
                    !transcript ||
                    !transcript.trim()
                ) {

                    await SessionEvent.create({

                        session:
                            session._id,

                        user:
                            session.user,

                        type:
                            "CHECK_IN_CLARIFY",

                        metadata: {
                            reason:
                                "EMPTY_TRANSCRIPT"
                        }

                    });

                    io.to(sessionId).emit(
                        "focus:clarify",
                        {
                            sessionId,

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
                            aiResult.confidence,
                        source:
                            aiResult.raw?.source ||
                            "ai"
                    }

                });

                switch (result.action) {

                    /*
                     * USER CONFIRMED COMPLETION
                     */
                    case "COMPLETE": {

                        await completeSessionAndAdvance({
                            userId:
                                session.user,

                            sessionId,

                            owner:
                                session.owner,

                            io
                        });

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
