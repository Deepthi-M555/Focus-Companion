const Task = require("../models/Task");
const FocusSession = require("../models/FocusSession");
const CompanionSettings =
    require("../models/CompanionSettings");

const {
    startSessionTimer,
    clearSessionTimer
} = require("./sessionTimerService");

async function getUserSettings(userId) {
    return CompanionSettings.findOneAndUpdate(
        {
            userId
        },
        {
            $setOnInsert: {
                userId
            }
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
}

function recoverSchedule({

    remainingTasks,

    availableMinutes,
    regenerate = false

}) {

    const recoveredTasks =
        [...remainingTasks];
    const budget =
        normalizeMinutes(availableMinutes);

    let totalWork =
        recoveredTasks.reduce(

            (sum, task) =>

                sum +
                normalizeMinutes(task.estimatedDuration || 0),

            0

        );

    if (
        !regenerate ||
        totalWork <=
        budget
    ) {

        return {

            tasks:
                recoveredTasks,

            recovered:
                false,

            suggestions: []

        };

    }

    /*
        Lowest priority first
    */

    recoveredTasks.sort(
        (a, b) =>
            (a.priority || 1) -
            (b.priority || 1)
    );

    const suggestions = [];

    for (const task of recoveredTasks) {

        if (
            totalWork <=
            budget
        ) {

            break;

        }

        /*
            Preserve important tasks
        */

        if (
            (task.priority || 1) >= 4
        ) {

            continue;

        }

        const originalDuration =
            normalizeMinutes(task.estimatedDuration || 0);

        const compressedDuration =
            Math.max(
                1,
                Math.min(
                    originalDuration,
                    Math.floor(
                        originalDuration *
                        0.8
                    )
                )
            );

        task.estimatedDuration =
            compressedDuration;

        totalWork -=
            (
                originalDuration -
                compressedDuration
            );

        suggestions.push(

            `Compressed "${task.title || "Untitled task"}" from ${originalDuration}m to ${compressedDuration}m`

        );

    }

    return {

        tasks:
            recoveredTasks,

        recovered:
            true,

        suggestions

    };

}

function normalizeMinutes(value) {
    return Math.max(0, Math.round(Number(value || 0)));
}

function applyRecoveryBudgetToTasks({
    tasks,
    availableMinutes
}) {
    const budget =
        normalizeMinutes(availableMinutes);

    if (!Array.isArray(tasks) || !tasks.length || budget <= 0) {
        return tasks;
    }

    let total =
        tasks.reduce(
            (sum, task) =>
                sum + normalizeMinutes(task.estimatedDuration),
            0
        );

    if (total <= 0 || total >= budget) {
        return tasks;
    }

    let extra =
        budget - total;

    for (let index = 0; extra > 0; index = (index + 1) % tasks.length) {
        tasks[index].estimatedDuration =
            normalizeMinutes(tasks[index].estimatedDuration) + 1;
        extra -= 1;
    }

    return tasks;
}

async function getRecoverySummary({ userId }) {

    const activeSession = await FocusSession.findOne({
        user: userId,
        status: {
            $in: [
                "active",
                "paused",
                "check_in_pending",
                "snoozed",
                "recovery"
            ]
        }
    });

    const elapsedMinutes = activeSession
        ? Math.max(0, normalizeMinutes(activeSession.totalPlannedMinutes) - normalizeMinutes(activeSession.remainingDuration))
        : 0;

    const originalPlannedMinutes = normalizeMinutes(activeSession?.originalPlannedMinutes || activeSession?.totalPlannedMinutes || 0);
    const remainingPlannedMinutes = Math.max(0, normalizeMinutes(activeSession?.totalPlannedMinutes || 0) - elapsedMinutes);

    const tasks = await Task.find({
        userId,
        archived: { $ne: true },
        completed: false,
        status: {
            $ne: "skipped"
        }
    }).sort({
        sequenceOrder: 1,
        createdAt: 1
    });

    const fallbackMinutes = tasks.reduce((sum, task) => sum + normalizeMinutes(task.estimatedDuration || 0), 0);
    const finalOriginalPlannedMinutes = originalPlannedMinutes || fallbackMinutes;
    const finalRemainingPlannedMinutes = remainingPlannedMinutes || fallbackMinutes;

    return {
        success: true,
        originalPlannedMinutes: finalOriginalPlannedMinutes,
        remainingPlannedMinutes: finalRemainingPlannedMinutes,
        totalPlannedMinutes: finalOriginalPlannedMinutes,
        extraMinutesAdded: Number(activeSession?.extraMinutesAdded || 0)
    };

}

async function regenerateRecoverySchedule({

    userId,

    remainingTasks,

    extraMinutes = 0

}) {

    const activeSession = await FocusSession.findOne({
        user: userId,
        status: {
            $in: [
                "active",
                "paused",
                "check_in_pending",
                "snoozed",
                "recovery"
            ]
        }
    });

    const elapsedMinutes = activeSession
        ? Math.max(0, normalizeMinutes(activeSession.totalPlannedMinutes) - normalizeMinutes(activeSession.remainingDuration))
        : 0;
    const remainingPlannedMinutes = Math.max(0, normalizeMinutes(activeSession?.totalPlannedMinutes || 0) - elapsedMinutes);
    const availableMinutes = remainingPlannedMinutes + normalizeMinutes(extraMinutes);

    const tasks =
        remainingTasks ||
        await Task.find({
            userId,
            archived: { $ne: true },
            completed: false,
            status: {
                $ne: "skipped"
            }
        }).sort({
            sequenceOrder: 1,
            createdAt: 1
        });

    if (activeSession) {
        activeSession.extraMinutesAdded = normalizeMinutes(activeSession.extraMinutesAdded) + normalizeMinutes(extraMinutes);
        activeSession.totalPlannedMinutes = normalizeMinutes(activeSession.originalPlannedMinutes || activeSession.totalPlannedMinutes || 0) + activeSession.extraMinutesAdded;
        await activeSession.save();
    }

    const recovered =
        recoverSchedule({
            userId,
            remainingTasks: tasks,
            availableMinutes,
            regenerate: true
        });

    applyRecoveryBudgetToTasks({
        tasks:
            recovered.tasks,
        availableMinutes
    });

    await Promise.all(
        recovered.tasks
            .filter(task => typeof task.save === "function")
            .map(async (task, index) => {
                task.estimatedDuration =
                    Math.max(
                        1,
                        normalizeMinutes(task.estimatedDuration) || 1
                    );
                task.sequenceOrder = index + 1;
                task.status = "pending";
                task.completed = false;
                task.archived = false;
                return task.save();
            })
    );

    if (activeSession) {
        clearSessionTimer(
            activeSession._id.toString()
        );

        activeSession.status = "skipped";
        activeSession.completedBy = "RECOVERY";
        activeSession.remainingDuration = 0;
        activeSession.endedAt = new Date();

        await activeSession.save();
    }

    return {
        success: true,
        tasks: recovered.tasks,
        recovered: recovered.recovered,
        suggestions: recovered.suggestions,
        recoveryResolved: Boolean(activeSession),
        totalPlannedMinutes: normalizeMinutes(activeSession?.totalPlannedMinutes || 0),
        originalPlannedMinutes: normalizeMinutes(activeSession?.originalPlannedMinutes || activeSession?.totalPlannedMinutes || 0),
        elapsedMinutes,
        remainingPlannedMinutes,
        availableMinutes,
        extraMinutesAdded: normalizeMinutes(activeSession?.extraMinutesAdded || 0)
    };

}

async function resumeFromRecovery({

    userId,
    clientType = "WEB",
    userMode = "gentle",
    io

}) {

    const currentTask =
        await Task.findOne({
            userId,
            archived: { $ne: true },
            completed: false,
            status: "in_progress"
        }).sort({
            updatedAt: -1
        });

    if (currentTask) {
        currentTask.status = "skipped";
        currentTask.completed = false;
        await currentTask.save();
    }

    const nextTask =
        await Task.findOne({
            userId,
            archived: { $ne: true },
            completed: false,
            status: "pending"
        }).sort({
            sequenceOrder: 1,
            createdAt: 1
        });

    let session = {};

    if (nextTask) {
        const activeSession = await FocusSession.findOne({
            user: userId,
            status: {
                $in: [
                    "active",
                    "paused",
                    "check_in_pending",
                    "snoozed",
                    "recovery"
                ]
            }
        });

        if (activeSession) {

            clearSessionTimer(
                activeSession._id.toString()
            );

            activeSession.status = "skipped";

            activeSession.completedBy =
                "RECOVERY";

            activeSession.endedAt =
                new Date();

            await activeSession.save();
        }

        const settings = await getUserSettings(userId);
        const nextTaskMinutes =
            Math.max(
                1,
                normalizeMinutes(nextTask.estimatedDuration) || 1
            );

        session = await FocusSession.create({
            user: userId,
            task: nextTask._id,
            plannedDuration:
                nextTaskMinutes,
            remainingDuration:
                nextTaskMinutes,
            originalPlannedMinutes:
                Number(
                    activeSession?.originalPlannedMinutes ||
                    activeSession?.totalPlannedMinutes ||
                    0
                ),
            totalPlannedMinutes:
                Number(
                    activeSession?.totalPlannedMinutes || 0
                ),
            scheduleGeneratedAt:
                activeSession?.scheduleGeneratedAt ||
                new Date(),
            originalTaskCount:
                Number(
                    await Task.countDocuments({
                        userId,
                        archived: { $ne: true },
                        completed: false
                    })
                ),
            extraMinutesAdded:
                activeSession
                    ? Number(
                        activeSession.extraMinutesAdded || 0
                    )
                    : 0,
            voiceResponseTimeout:
                settings.voiceResponseTimeout,
            snoozeDuration:
                settings.snoozeDuration,
            maxSnoozes:
                settings.maxSnoozes,
            snoozeCount: 0,
            status: "active",
            startedAt: new Date(),
            owner: clientType || "WEB",
            mode: userMode || "gentle"
        });

        nextTask.status = "in_progress";
        await nextTask.save();
        if (io) {
            startSessionTimer(
                io,
                session._id.toString(),
                nextTaskMinutes
            );
        }

    }

    return {
        success: true,
        session: session && session.toObject
            ? session.toObject()
            : session,
        nextTask: nextTask && nextTask.toObject
            ? nextTask.toObject()
            : nextTask || {}
    };

}

async function skipAndResume({

    userId,
    clientType = "WEB",
    io

}) {

    const session = await FocusSession.findOne({
        user: userId,
        status: {
            $in: [
                "active",
                "paused",
                "check_in_pending",
                "snoozed",
                "recovery"
            ]
        }
    }).populate("task");

    if (!session) {
        throw new Error("No active session");
    }

    const currentTaskId = session.task?._id || session.task;

    if (currentTaskId) {
        await Task.findByIdAndUpdate(
            currentTaskId,
            {
                status: "skipped",
                completed: false
            }
        );
    }

    clearSessionTimer(
        session._id.toString()
    );

    session.status = "skipped";
    session.completedBy = "RECOVERY";
    session.endedAt = new Date();

await session.save();

    const nextTask = await Task.findOne({
        userId,
        archived: { $ne: true },
        completed: false,
        status: "pending"
    }).sort({
        sequenceOrder: 1,
        createdAt: 1
    });

    if (!nextTask) {
        return {
            success: true,
            nextTask: null
        };
    }

    const settings =
    await getUserSettings(userId);
    const nextTaskMinutes =
        Math.max(
            1,
            normalizeMinutes(nextTask.estimatedDuration) || 1
        );

    const newSession =
    await FocusSession.create({
        user: userId,
        task: nextTask._id,
        owner: clientType,
        mode: session.mode || "gentle",
        plannedDuration:
            nextTaskMinutes,
        remainingDuration:
            nextTaskMinutes,
        originalPlannedMinutes:
            Number(
                session.originalPlannedMinutes ||
                session.totalPlannedMinutes ||
                0
            ),
        totalPlannedMinutes:
            Number(
                session.totalPlannedMinutes || 0
            ),
        originalTaskCount:
            Number(
                session.originalTaskCount || 0
            ),
        extraMinutesAdded:
            Number(
                session.extraMinutesAdded || 0
            ),
        scheduleGeneratedAt:
            session.scheduleGeneratedAt ||
            new Date(),
        voiceResponseTimeout:
            settings.voiceResponseTimeout,
        snoozeDuration:
            settings.snoozeDuration,
        maxSnoozes:
            settings.maxSnoozes,
        snoozeCount: 0,
        status: "active",
        startedAt: new Date()
    });
    if (io) {
        startSessionTimer(
            io,
            newSession._id.toString(),
            nextTaskMinutes
        );
    }

    nextTask.status = "in_progress";
    await nextTask.save();

    return {
        success: true,
        session: newSession,
        nextTask
    };

}

module.exports = {
    recoverSchedule,
    getRecoverySummary,
    regenerateRecoverySchedule,
    resumeFromRecovery,
    skipAndResume
};
