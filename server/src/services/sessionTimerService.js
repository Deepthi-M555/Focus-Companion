const FocusSession =
require("../models/FocusSession");

const SessionEvent =
require("../models/SessionEvent");

const {
    STATES,
    transition
} = require("./focusStateMachine");

const activeTimers = new Map();

function logTimerOperationError(operation, sessionId, error) {
    console.error(
        `[sessionTimerService:${operation}] session=${sessionId}`,
        error
    );
}


const setTimer = (
    sessionId,
    timer
) => {

    clearSessionTimer(sessionId);

    activeTimers.set(
        sessionId,
        timer
    );
};


const startSessionTimer =
async (
    io,
    sessionId,
    duration
) => {

    try {
        clearSessionTimer(
            sessionId
        );

        const durationMinutes =
            Number(duration);

        if (
            !Number.isFinite(durationMinutes) ||
            durationMinutes <= 0
        ) {

            console.error(
                "Invalid session timer duration:",
                duration
            );

            return;
        }

        const session =
            await FocusSession.findById(
                sessionId
            );

        if (!session) {
            return;
        }

        const timer =
            setTimeout(
                async () => {

                    try {

                        await triggerCheckIn(
                            io,
                            sessionId
                        );

                    } catch (error) {

                        logTimerOperationError(
                            "triggerCheckIn",
                            sessionId,
                            error
                        );

                        clearSessionTimer(
                            sessionId
                        );

                    }

                },

                durationMinutes *
                60 *
                1000
            );

        activeTimers.set(
            sessionId,
            timer
        );
    } catch (error) {
        logTimerOperationError(
            "startSessionTimer",
            sessionId,
            error
        );
    }
};

const triggerCheckIn =
async (
    io,
    sessionId
) => {

    clearSessionTimer(sessionId);

    const session =
    await FocusSession.findById(
        sessionId
    );

if (!session) {
    return;
}

if (
    session.status !== STATES.ACTIVE &&
    session.status !== STATES.SNOOZED
) {
    return;
}

const currentState =
    session.status;

const nextState =
    transition({
        currentState,
        nextState:
            STATES.CHECK_IN_PENDING
    });

    session.status = nextState;

    session.remainingDuration = 0;

    await session.save();

    await SessionEvent.create({

        session:
            session._id,

        user:
            session.user,

        type:
            "CHECK_IN_TRIGGERED",

        metadata: {
            snoozeCount:
                session.snoozeCount
        }

    });

    io.to(sessionId).emit(
        "show-check-in",
        {
            sessionId,

            timeout:
                session.voiceResponseTimeout,

            snoozeDuration:
                session.snoozeDuration,

            snoozeCount:
                session.snoozeCount,

            maxSnoozes:
                session.maxSnoozes
        }
    );

    startResponseTimer(
        io,
        sessionId
    );
};


const startResponseTimer =
async (
    io,
    sessionId
) => {

    try {
        const session =
            await FocusSession.findById(
                sessionId
            );

        if (!session) {
            return;
        }

        const configuredTimeout =
            Number(
                session.voiceResponseTimeout ?? 60
            );

        const processingGraceSeconds = 5;

        const timeout =
            Math.max(
                15,
                configuredTimeout +
                processingGraceSeconds
            );

        const responseTimer =
            setTimeout(
                async () => {

                    try {

                        await handleNoResponse(
                            io,
                            sessionId
                        );

                    } catch (error) {

                        logTimerOperationError(
                            "handleNoResponse",
                            sessionId,
                            error
                        );

                        clearSessionTimer(
                            sessionId
                        );
                    }

                },

                timeout * 1000
            );

        setTimer(
            sessionId,
            responseTimer
        );
    } catch (error) {
        logTimerOperationError(
            "startResponseTimer",
            sessionId,
            error
        );
    }
};


const handleNoResponse =
async (
    io,
    sessionId
) => {

    clearSessionTimer(sessionId);

    const session =
        await FocusSession.findById(
            sessionId
        );

    if (!session) {
        return;
    }

    if (
        session.status !==
        STATES.CHECK_IN_PENDING
    ) {
        return;
    }

    session.snoozeCount += 1;

    /*
     * Example maxSnoozes = 3:
     *
     * missed check-in #1 -> snooze
     * missed check-in #2 -> snooze
     * missed check-in #3 -> snooze
     * missed check-in #4 -> recovery
     */

    if (
        session.snoozeCount >
        session.maxSnoozes
    ) {

        session.status =
            transition({
                currentState:
                    session.status,
                nextState:
                    STATES.RECOVERY_ENGINE
            });

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
                    "MAX_SNOOZE_REACHED",

                snoozeCount:
                    session.snoozeCount
            }

        });

        io.to(sessionId).emit(
            "focus:recovery",
            {
                sessionId
            }
        );

        return;
    }

    session.status =
        transition({
            currentState:
                session.status,
            nextState:
                STATES.SNOOZED
        });

    await session.save();

    await SessionEvent.create({

        session:
            session._id,

        user:
            session.user,

        type:
            "SNOOZE",

        metadata: {

            automatic: true,

            snoozeCount:
                session.snoozeCount,

            snoozeDuration:
                session.snoozeDuration
        }

    });

    io.to(sessionId).emit(
        "focus:snoozed",
        {
            sessionId,

            snoozeCount:
                session.snoozeCount,

            maxSnoozes:
                session.maxSnoozes,

            snoozeDuration:
                session.snoozeDuration
        }
    );

    await startSnoozeTimer(
        io,
        sessionId
    );
};


const startSnoozeTimer =
async (
    io,
    sessionId
) => {

    try {
        const session =
            await FocusSession.findById(
                sessionId
            );

        if (!session) {
            return;
        }

        const duration =
            session.snoozeDuration ?? 5;

        const snoozeTimer =
            setTimeout(
                async () => {

                    try {

                        await triggerCheckIn(
                            io,
                            sessionId
                        );

                    } catch (error) {

                        logTimerOperationError(
                            "snoozeTriggerCheckIn",
                            sessionId,
                            error
                        );

                        clearSessionTimer(
                            sessionId
                        );
                    }

                },

                duration * 60 * 1000
            );

        setTimer(
            sessionId,
            snoozeTimer
        );
    } catch (error) {
        logTimerOperationError(
            "startSnoozeTimer",
            sessionId,
            error
        );
    }
};


const clearSessionTimer =
(sessionId) => {

    const timer =
        activeTimers.get(
            sessionId
        );

    if (timer) {

        clearTimeout(timer);

        activeTimers.delete(
            sessionId
        );
    }
};


module.exports = {

    startSessionTimer,

    clearSessionTimer,

    triggerCheckIn,

    startSnoozeTimer

};
