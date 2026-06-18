function parseResponse(text) {
    try {
        const parsed = JSON.parse(text);

        return {
            message: parsed.message || "",
            action: parsed.action || "NONE",
            suggestions: parsed.suggestions || []
        };

    } catch {
        return {
            message: text,
            action: "NONE",
            suggestions: []
        };
    }
}