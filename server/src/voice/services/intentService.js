function detectIntent(transcript) {

    const text =
        transcript.toLowerCase();

    if (
        text.includes("pause")
    ) {
        return {
            intent:
                "PAUSE_SESSION"
        };
    }

    if (
        text.includes("resume")
    ) {
        return {
            intent:
                "RESUME_SESSION"
        };
    }

    if (
        text.includes("complete")
    ) {
        return {
            intent:
                "COMPLETE_SESSION"
        };
    }

    if (
        text.includes("snooze")
    ) {

        const match =
            text.match(
                /(\d+)\s*minute/
            );

        return {
            intent:
                "SNOOZE_SESSION",

            duration:
                match
                    ? Number(match[1])
                    : 5
        };
    }

    return {

        intent:
            "AI_COMPANION"

    };
}

module.exports = {
    detectIntent
};