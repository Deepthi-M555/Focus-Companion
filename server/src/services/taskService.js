const Task = require("../models/Task");

async function saveSchedule({

    userId,

    tasks

}) {

    await Task.deleteMany({

        userId,

        completed: false,

        status: {
            $ne: "in_progress"
        }

    });

    const documents = tasks
    .filter(task => task.status !== "in_progress")
    .map(

        (task, index) => ({

            userId,

            title: task.title,

            description:
                task.description || "",

            estimatedDuration:
                task.estimatedDuration,

            priority:
                task.priority || 1,

            type:
                task.type || "ELASTIC",

            fixedStartTime:
                task.fixedStartTime || null,

            fixedEndTime:
                task.fixedEndTime || null,

            sequenceOrder: index + 1

        })

    );

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

        completed: false

    })

    .sort({

        sequenceOrder: 1

    });

}

module.exports = {

    saveSchedule,

    loadTodaySchedule

};
