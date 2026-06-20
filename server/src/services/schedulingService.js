function generateSchedule(tasks, startTime = new Date()) {

    const elasticTasks =
        tasks
            .filter(
                task =>
                    task.type ===
                    "ELASTIC"
            )
            .sort(
                (a, b) =>
                    b.priority -
                    a.priority
            );

    const inelasticTasks =
        tasks
            .filter(
                task =>
                    task.type ===
                    "INELASTIC"
            )
            .sort(
                (a, b) =>
                    new Date(a.fixedStartTime) -
                    new Date(b.fixedStartTime)
            );

    const schedule = [];

    let currentTime =
        new Date(startTime);

    for (const task of elasticTasks) {

        const taskStart =
            new Date(currentTime);

        const taskEnd =
            new Date(
                taskStart.getTime() +
                task.estimatedDuration *
                60000
            );

        schedule.push({

            title:
                task.title,

            type:
                task.type,

            priority:
                task.priority,

            startTime:
                taskStart,

            endTime:
                taskEnd

        });

        /*
            Adaptive Break Logic
        */

        let breakMinutes = 5;

        if (
            task.estimatedDuration >= 90
        ) {

            breakMinutes = 15;

        } else if (
            task.estimatedDuration >= 45
        ) {

            breakMinutes = 10;

        }

        currentTime =
            new Date(
                taskEnd.getTime() +
                breakMinutes * 60000
            );

    }

    /*
        Fixed Tasks
    */

    for (const task of inelasticTasks) {

        schedule.push({

            title:
                task.title,

            type:
                task.type,

            priority:
                task.priority,

            startTime:
                task.fixedStartTime,

            endTime:
                task.fixedEndTime

        });

    }

    schedule.sort(
        (a, b) =>
            new Date(a.startTime) -
            new Date(b.startTime)
    );

    return schedule;
}

module.exports = {
    generateSchedule
};