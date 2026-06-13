function getBestFocusWindow(sessions) {

    if (sessions.length === 0) {
        return null;
    }

    const hourlyScores = {};

    sessions.forEach(session => {

        const hour =
            new Date(session.startedAt)
            .getHours();

        if (!hourlyScores[hour]) {

            hourlyScores[hour] = [];

        }

        hourlyScores[hour].push(
            session.focusScore
        );

    });

    let bestHour = null;
    let bestAverage = 0;

    Object.entries(hourlyScores)
        .forEach(([hour, scores]) => {

            const average =
                scores.reduce(
                    (a, b) => a + b,
                    0
                ) / scores.length;

            if (average > bestAverage) {

                bestAverage = average;

                bestHour = Number(hour);

            }

        });

    if (bestHour === null) {
        return null;
    }

    return {
        startHour: bestHour,
        endHour: bestHour + 1,
        averageScore: Math.round(bestAverage)
    };
}

function getStrongestSubject(
    sessions
) {

    if (sessions.length === 0) {
        return null;
    }

    const subjectScores = {};

    sessions.forEach(session => {

        const subject =
            session.subject;

        if (!subject) {
            return;
        }

        if (!subjectScores[subject]) {

            subjectScores[subject] = [];

        }

        subjectScores[subject].push(
            session.focusScore
        );

    });

    let bestSubject = null;
    let bestAverage = 0;

    Object.entries(subjectScores)
        .forEach(([subject, scores]) => {

            const average =
                scores.reduce(
                    (a, b) => a + b,
                    0
                ) / scores.length;

            if (average > bestAverage) {

                bestAverage = average;

                bestSubject = subject;

            }

        });

    if (!bestSubject) {
        return null;
    }

    return {
        subject: bestSubject,
        averageScore: Math.round(bestAverage)
    };
}

function getRecoveryRisk(
    sessions
) {

    if (sessions.length === 0) {
        return "LOW";
    }

    const totalSnoozes =
        sessions.reduce(
            (sum, session) =>
                sum +
                (session.snoozes || 0),
            0
        );

    const average =
        totalSnoozes /
        sessions.length;

    if (average >= 3) {

        return "HIGH";

    }

    if (average >= 1) {

        return "MEDIUM";

    }

    return "LOW";
}

module.exports = {
    getBestFocusWindow,
    getStrongestSubject,
    getRecoveryRisk
};