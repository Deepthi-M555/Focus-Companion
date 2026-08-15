const Task = require("../models/Task");

function normalizeTaskDuration(value) {
    const duration =
        Number(value);

    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        return null;
    }

    return Math.floor(duration);
}

/**
 * Save a newly generated timetable.
 *
 * Pending tasks are replaced.
 * Started/completed/skipped tasks are preserved.
 */
async function saveSchedule({ userId, tasks }) {
    if (!Array.isArray(tasks)) {
        throw new Error("Tasks must be an array.");
    }

    await Task.updateMany(
        {
            userId,
            archived: {
                $ne: true
            }
        },
        {
            $set: {
                archived: true
            }
        }
    );

    const documents = tasks
        .map(task => ({
            ...task,
            estimatedDuration:
                normalizeTaskDuration(
                    task?.estimatedDuration
                )
        }))
        .filter(task =>
            task &&
            task.title &&
            task.estimatedDuration > 0 &&
            (!task.status || task.status === "pending")
        )
        .map((task, index) => ({
            userId,
            title: task.title,
            description: task.description || "",
            estimatedDuration: task.estimatedDuration,
            priority: task.priority || 1,
            type: task.type || "ELASTIC",
            fixedStartTime: task.fixedStartTime || null,
            fixedEndTime: task.fixedEndTime || null,
            sequenceOrder: index + 1,
            status: "pending",
            completed: false
        }));

    if (!documents.length) {
        return [];
    }

    return Task.insertMany(documents);
}

/**
 * Returns the active timetable.
 */
async function loadActiveSchedule(userId) {
    return Task.find({
        userId,
        archived: {
            $ne: true
        },
        completed: false,
        status: {
            $in: ["pending", "in_progress"]
        }
    }).sort({
        sequenceOrder: 1
    });
}

async function loadTodaySchedule(userId) {
    return Task.find({
        userId,
        archived: {
            $ne: true
        }
    }).sort({
        sequenceOrder: 1,
        createdAt: 1
    });
}

/**
 * Returns the task currently in progress.
 */
async function getCurrentTask(userId) {
    return Task.findOne({
        userId,
        archived: {
            $ne: true
        },
        completed: false,
        status: "in_progress"
    });
}

async function getNextPendingTask(userId) {
    return Task.findOne({
        userId,
        archived: {
            $ne: true
        },
        completed: false,
        status: "pending"
    }).sort({
        sequenceOrder: 1,
        createdAt: 1
    });
}

/**
 * Checks whether there are pending tasks left.
 */
async function hasPendingTasks(userId) {
    const count = await Task.countDocuments({
        userId,
        archived: {
            $ne: true
        },
        completed: false,
        status: "pending"
    });

    return count > 0;
}

async function getTaskProgress(userId, taskId) {

    const tasks = await Task.find({
        userId,
        archived: {
            $ne: true
        }
    }).sort({
        sequenceOrder: 1,
        createdAt: 1
    });

    const currentTaskIndex =
        tasks.findIndex(
            task =>
                String(task._id) ===
                String(taskId)
        ) + 1;

    return {
        currentTaskIndex,
        totalTasks: tasks.length
    };
}

module.exports = {
    saveSchedule,
    loadActiveSchedule,
    loadTodaySchedule,
    getCurrentTask,
    getNextPendingTask,
    hasPendingTasks,
    getTaskProgress
};
