const Task = require("../models/Task");
const FocusSession = require("../models/FocusSession");
const User = require("../models/User");

function recoverSchedule({

    remainingTasks,

    availableMinutes,
    regenerate = false

}) {

    const recoveredTasks =
        [...remainingTasks];

    let totalWork =
        recoveredTasks.reduce(

            (sum, task) =>

                sum +
                Number(task.estimatedDuration || 0),

            0

        );

    if (
        !regenerate ||
        totalWork <=
        availableMinutes
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
            availableMinutes
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
            Number(task.estimatedDuration || 0);

        const compressedDuration =
            Math.max(

                15,

                Math.floor(
                    originalDuration *
                    0.8
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

async function getRecoverySummary({ userId }) {

    const activeSession = await FocusSession.findOne({
        user: userId,
        status: {
            $in: [
                "active",
                "paused",
                "check_in_pending",
                "snoozed"
            ]
        }
    });

    const elapsedMinutes = activeSession
        ? Math.max(0, Number(activeSession.totalPlannedMinutes || 0) - Number(activeSession.remainingDuration || 0))
        : 0;

    const originalPlannedMinutes = Number(activeSession?.originalPlannedMinutes || activeSession?.totalPlannedMinutes || 0);
    const remainingPlannedMinutes = Math.max(0, Number(activeSession?.totalPlannedMinutes || 0) - elapsedMinutes);

    const tasks = await Task.find({
        userId,
        completed: false,
        status: {
            $ne: "skipped"
        }
    }).sort({
        sequenceOrder: 1,
        createdAt: 1
    });

    const fallbackMinutes = tasks.reduce((sum, task) => sum + Number(task.estimatedDuration || 0), 0);
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
                "snoozed"
            ]
        }
    });

    const elapsedMinutes = activeSession
        ? Math.max(0, Number(activeSession.totalPlannedMinutes || 0) - Number(activeSession.remainingDuration || 0))
        : 0;
    const remainingPlannedMinutes = Math.max(0, Number(activeSession?.totalPlannedMinutes || 0) - elapsedMinutes);
    const availableMinutes = remainingPlannedMinutes + Number(extraMinutes || 0);

    const tasks =
        remainingTasks ||
        await Task.find({
            userId,
            completed: false,
            status: {
                $ne: "skipped"
            }
        }).sort({
            sequenceOrder: 1,
            createdAt: 1
        });

    if (activeSession) {
        activeSession.extraMinutesAdded += Number(extraMinutes || 0);
        activeSession.totalPlannedMinutes = Number(activeSession.originalPlannedMinutes || activeSession.totalPlannedMinutes || 0) + activeSession.extraMinutesAdded;
        await activeSession.save();
    }

    const recovered =
        recoverSchedule({
            userId,
            remainingTasks: tasks,
            availableMinutes,
            regenerate: true
        });

    await Promise.all(
        recovered.tasks
            .filter(task => typeof task.save === "function")
            .map(async (task, index) => {
                task.sequenceOrder = index + 1;
                return task.save();
            })
    );

    return {
        success: true,
        tasks: recovered.tasks,
        recovered: recovered.recovered,
        suggestions: recovered.suggestions,
        totalPlannedMinutes: Number(activeSession?.totalPlannedMinutes || 0),
        originalPlannedMinutes: Number(activeSession?.originalPlannedMinutes || activeSession?.totalPlannedMinutes || 0),
        elapsedMinutes,
        remainingPlannedMinutes,
        availableMinutes,
        extraMinutesAdded: Number(activeSession?.extraMinutesAdded || 0)
    };

}

async function resumeFromRecovery({

    userId,
    clientType = "WEB",
    userMode = "gentle"

}) {

    const currentTask =
        await Task.findOne({
            userId,
            completed: false,
            status: "in_progress"
        }).sort({
            updatedAt: -1
        });

    if (currentTask) {
        currentTask.status = "skipped";
        currentTask.completed = true;
        await currentTask.save();
    }

    const nextTask =
        await Task.findOne({
            userId,
            completed: false,
            status: {
                $nin: [
                    "skipped",
                    "completed"
                ]
            }
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
                    "snoozed"
                ]
            }
        });

        await FocusSession.updateMany(
            {
                user: userId,
                status: {
                    $in: [
                        "active",
                        "paused",
                        "check_in_pending",
                        "snoozed"
                    ]
                }
            },
            {
                status: "failed",
                endedAt: new Date()
            }
        );

        session = await FocusSession.create({
            user: userId,
            task: nextTask._id,
            plannedDuration: Number(nextTask.estimatedDuration || 25),
            remainingDuration: Number(nextTask.estimatedDuration || 25),
            originalPlannedMinutes: Number(activeSession?.originalPlannedMinutes || activeSession?.totalPlannedMinutes || 0),
            totalPlannedMinutes: Number(activeSession?.totalPlannedMinutes || 0),
            scheduleGeneratedAt: activeSession?.scheduleGeneratedAt || new Date(),
            originalTaskCount: Number(await Task.countDocuments({ userId, completed: false })),
            extraMinutesAdded: activeSession ? Number(activeSession.extraMinutesAdded || 0) : 0,
            status: "active",
            startedAt: new Date(),
            owner: clientType || "WEB",
            mode: userMode || "gentle"
        });

        await User.findByIdAndUpdate(
            userId,
            {
                activeSessionId: session._id
            }
        );
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
    clientType = "WEB"

}) {

    const session = await FocusSession.findOne({
        user: userId,
        status: {
            $in: [
                "active",
                "paused",
                "check_in_pending",
                "snoozed"
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
                completed: true
            }
        );
    }

    session.status = "skipped";
    session.endedAt = new Date();
    await session.save();

    const nextTask = await Task.findOne({
        userId,
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

    const newSession = await FocusSession.create({
        user: userId,
        task: nextTask._id,
        owner: clientType,
        mode: session.mode || "gentle",
        plannedDuration: Number(nextTask.estimatedDuration || 25),
        remainingDuration: Number(nextTask.estimatedDuration || 25),
        originalPlannedMinutes: Number(session.originalPlannedMinutes || session.totalPlannedMinutes || 0),
        totalPlannedMinutes: Number(session.totalPlannedMinutes || 0),
        originalTaskCount: Number(session.originalTaskCount || 0),
        extraMinutesAdded: Number(session.extraMinutesAdded || 0),
        scheduleGeneratedAt: session.scheduleGeneratedAt || new Date(),
        status: "active",
        startedAt: new Date()
    });

    await User.findByIdAndUpdate(
        userId,
        {
            activeSessionId: newSession._id
        }
    );

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