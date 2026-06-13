function calculateFocusScore({
    focusedMinutes,
    plannedMinutes,
    distractions
}) {

    if (plannedMinutes === 0) {
        return 0;
    }

    const completionScore =
        (focusedMinutes / plannedMinutes) * 100;

    const distractionPenalty =
        Math.min(distractions * 3, 30);

    return Math.max(
        0,
        Math.round(
            completionScore - distractionPenalty
        )
    );
}