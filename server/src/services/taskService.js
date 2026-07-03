const Task = require("../models/Task");

async function saveSchedule({

    userId,

    tasks

}) {

    await Task.deleteMany({

        userId,

        completed: false

    });

    const documents = tasks.map(

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