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
                task.estimatedDuration,

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
            a.priority -
            b.priority
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
            task.priority >= 4
        ) {

            continue;

        }

        const originalDuration =
            task.estimatedDuration;

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

            `Compressed "${task.title}" from ${originalDuration}m to ${compressedDuration}m`

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

module.exports = {
    recoverSchedule
};