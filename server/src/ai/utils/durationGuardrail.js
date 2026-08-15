function extractAvailableMinutes(
    message
) {

    if (!message) {
        return null;
    }

    const text =
        message
            .toLowerCase()
            .replace(/,/g, "");

    const hourMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/
        );

    const minuteMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*(minutes?|mins?|m)\b/
        );

    if (hourMatch) {
        return Math.round(
            Number(hourMatch[1]) * 60
        );
    }

    if (minuteMatch) {
        return Math.round(
            Number(minuteMatch[1])
        );
    }

    return null;
}

function normalizeDuration(value) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 1;
    }

    return Math.max(1, Math.floor(parsed));
}

function applyDurationGuardrail(
    tasks,
    userMessage
) {

    if (!Array.isArray(tasks)) {
        return [];
    }

    const availableMinutes =
        extractAvailableMinutes(
            userMessage
        );

    const normalizedTasks =
        tasks.map(task => ({
            ...task,
            estimatedDuration:
                normalizeDuration(
                    task?.estimatedDuration
                )
        }));

    if (
        !Number.isFinite(availableMinutes) ||
        availableMinutes <= 0
    ) {
        return normalizedTasks;
    }

    if (availableMinutes < normalizedTasks.length) {
        return normalizedTasks
            .slice(0, availableMinutes)
            .map(task => ({
                ...task,
                estimatedDuration: 1
            }));
    }

    let remaining = availableMinutes;
    const guardedTasks = [];

    normalizedTasks.forEach((task, index) => {
        const remainingTasks = normalizedTasks.length - index;
        const minimumForRemaining = Math.max(0, remainingTasks - 1);
        const allowed = Math.max(1, remaining - minimumForRemaining);
        const duration = Math.min(
            normalizeDuration(task?.estimatedDuration),
            allowed
        );

        if (duration <= 0) {
            return;
        }

        remaining -= duration;
        guardedTasks.push({
            ...task,
            estimatedDuration: duration
        });
    });

    return guardedTasks;
}

module.exports = {
    extractAvailableMinutes,
    normalizeDuration,
    applyDurationGuardrail
};