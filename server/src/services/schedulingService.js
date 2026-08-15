const { buildTimeline } = require("./linkedScheduleService");

function normalizeDuration(value) {
    const duration = Number(value);

    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        return null;
    }

    return Math.max(
        1,
        Math.floor(duration)
    );
}

function generateSchedule(tasks = []) {
    if (!Array.isArray(tasks)) {
        return [];
    }

    return buildTimeline(tasks)
        .map((task, index) => {
            const estimatedDuration =
                normalizeDuration(
                    task.estimatedDuration
                );

            if (!estimatedDuration) {
                return null;
            }

            return {
                ...(
                    task.toObject
                        ? task.toObject()
                        : task
                ),
                estimatedDuration,
                sequenceOrder:
                    Number(task.sequenceOrder) ||
                    index + 1,
                status:
                    task.status || "pending",
                completed:
                    Boolean(task.completed)
            };
        })
        .filter(Boolean);
}

module.exports = {
    generateSchedule,
    normalizeDuration
};
