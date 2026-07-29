const Task = require("../models/Task");

async function saveSchedule({
    userId,
    tasks
}) {

    if (!Array.isArray(tasks)) {
        throw new Error(
            "Tasks must be an array."
        );
    }

    /*
     * Replace only tasks that have not started.
     *
     * Historical completed/skipped tasks remain history.
     * Active in_progress task is never deleted here.
     */
    await Task.deleteMany({
        userId,
        status: "pending"
    });

    /*
     * A newly generated timetable should contain
     * only new/startable schedule blocks.
     */
    const documents = tasks
        .filter(task =>
            task &&
            task.title &&
            Number(task.estimatedDuration) > 0 &&
            (
                !task.status ||
                task.status === "pending"
            )
        )
        .map((task, index) => ({
            userId,

            title: task.title,

            description:
                task.description || "",

            estimatedDuration:
                Number(
                    task.estimatedDuration
                ),

            priority:
                task.priority || 1,

            type:
                task.type || "ELASTIC",

            fixedStartTime:
                task.fixedStartTime || null,

            fixedEndTime:
                task.fixedEndTime || null,

            sequenceOrder:
                index + 1,

            status: "pending",

            completed: false
        }));

    if (!documents.length) {
        return [];
    }

    return Task.insertMany(
        documents
    );
}


async function loadTodaySchedule(
    userId
) {

    return Task.find({
        userId,

        completed: false,

        status: {
            $in: [
                "pending",
                "in_progress"
            ]
        }
    })
    .sort({
        sequenceOrder: 1
    });
}


module.exports = {
    saveSchedule,
    loadTodaySchedule
};