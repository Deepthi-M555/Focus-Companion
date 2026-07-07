const Task = require("../models/Task");
const FocusSession = require("../models/FocusSession");

function recoverSchedule({

    remainingTasks,

    availableMinutes

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

async function regenerateRecoverySchedule({

    userId,

    remainingTasks,

    availableMinutes = 480

}) {

    const tasks =
        remainingTasks ||
        await Task.find({
            userId,
            completed: false
        }).sort({
            sequenceOrder: 1,
            createdAt: 1
        });

    const recovered =
        recoverSchedule({
            remainingTasks: tasks,
            availableMinutes
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
        suggestions: recovered.suggestions
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
            status: {
                $in: [
                    "in_progress",
                    "paused"
                ]
            }
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
            status: "active",
            startedAt: new Date(),
            owner: clientType || "WEB",
            mode: userMode || "gentle"
        });
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

module.exports = {
    recoverSchedule,
    regenerateRecoverySchedule,
    resumeFromRecovery
};