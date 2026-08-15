const FocusSession =
    require("../models/FocusSession");

const Task =
    require("../models/Task");

const CompanionSettings =
    require("../models/CompanionSettings");

const SessionEvent =
    require("../models/SessionEvent");

const {
    STATES,
    transition
} = require("./focusStateMachine");

const {
    getNextPendingTask,
    getTaskProgress
} = require("./taskService");

const {
    startSessionTimer,
    clearSessionTimer
} = require("./sessionTimerService");


async function completeSessionAndAdvance({
    userId,
    sessionId,
    owner = "WEB",
    io
}) {

    const session =
        await FocusSession.findOne({
            _id: sessionId,
            user: userId
        });

    if (!session) {
        throw new Error("Session not found.");
    }

    if (
        session.owner === "DESKTOP" &&
        owner !== "DESKTOP"
    ) {
        const error = new Error(
            "Session is controlled by the desktop client."
        );

        error.statusCode = 409;

        throw error;
    }

    if (
        session.status !== STATES.CHECK_IN_PENDING &&
        session.status !== STATES.RECOVERY_ENGINE
    ) {
        const error = new Error(
            "Session is not waiting for completion."
        );

        error.statusCode = 409;

        throw error;
    }

    clearSessionTimer(
        session._id.toString()
    );

    const nextState =
        transition({
            currentState:
                session.status,

            nextState:
                STATES.COMPLETED
        });

    session.status =
        nextState;

    session.completedBy =
        "USER";

    session.endedAt =
        new Date();

    session.remainingDuration =
        0;

    session.actualDuration =
        session.plannedDuration;

    await session.save();

    await Task.findOneAndUpdate(
        {
            _id: session.task,
            userId
        },
        {
            status: "completed",
            completed: true
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

    const nextTask =
        await getNextPendingTask(
            userId
        );

    if (!nextTask) {

        if (io) {
            io.to(
                session._id.toString()
            ).emit(
                "focus:complete",
                {
                    sessionId:
                        session._id.toString(),

                    finalTask:
                        true,

                    timetableComplete:
                        true
                }
            );
        }

        return {
            completedSession:
                session,

            nextSession:
                null,

            nextTask:
                null,

            timetableComplete:
                true
        };
    }

    const settings =
        await CompanionSettings.findOneAndUpdate(
            {
                userId
            },
            {
                $setOnInsert: {
                    userId
                }
            },
            {
                returnDocument: "after",
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

    nextTask.status =
        "in_progress";

    nextTask.completed =
        false;

    await nextTask.save();

    const nextTaskMinutes =
        Math.max(
            1,
            Math.floor(
                Number(nextTask.estimatedDuration) || 1
            )
        );

    const remainingTasks =
        await Task.find({
            userId,
            archived: { $ne: true },
            completed: false,
            status: {
                $in: [
                    "pending",
                    "in_progress"
                ]
            }
        });

    const totalPlannedMinutes =
        remainingTasks.reduce(
            (sum, task) =>
                sum +
                Number(
                    task.estimatedDuration || 0
                ),
            0
        );

    const nextSession =
        await FocusSession.create({

            user: userId,

            task:
                nextTask._id,

            mode:
                session.mode,

            plannedDuration:
                nextTaskMinutes,

            remainingDuration:
                nextTaskMinutes,

            originalPlannedMinutes:
                totalPlannedMinutes,

            totalPlannedMinutes:
                totalPlannedMinutes,

            originalTaskCount:
                remainingTasks.length,

            extraMinutesAdded:
                0,

            owner,

            status:
                STATES.ACTIVE,

            startedAt:
                new Date(),

            voiceResponseTimeout:
                settings.voiceResponseTimeout,

            snoozeDuration:
                settings.snoozeDuration,

            maxSnoozes:
                settings.maxSnoozes,

            snoozeCount:
                0
        });

    await SessionEvent.create({
        session:
            nextSession._id,

        user:
            userId,

        type:
            "SESSION_START"
    });

    const progress =
        await getTaskProgress(
            userId,
            nextTask._id
        );

    if (io) {

        startSessionTimer(
            io,
            nextSession._id.toString(),
            nextTaskMinutes
        );

        io.to(
            session._id.toString()
        ).emit(
            "focus:next-task",
            {
                completedSessionId:
                    session._id.toString(),

                session:
                    nextSession,

                task:
                    nextTask,

                currentTaskIndex:
                    progress.currentTaskIndex,

                totalTasks:
                    progress.totalTasks
            }
        );
    }

    return {
        completedSession:
            session,

        nextSession,

        nextTask,

        currentTaskIndex:
            progress.currentTaskIndex,

        totalTasks:
            progress.totalTasks,

        timetableComplete:
            false
    };
}


module.exports = {
    completeSessionAndAdvance
};
