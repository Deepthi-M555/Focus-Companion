async function executeCommand({

    intent,

    duration,

    socket,

    sessionId

}) {

    switch (intent) {

        case "PAUSE_SESSION":

            socket.emit(
                "pause-session",
                { sessionId }
            );

            break;

        case "RESUME_SESSION":

            socket.emit(
                "resume-session",
                { sessionId }
            );

            break;

        case "COMPLETE_SESSION":

            socket.emit(
                "complete-session",
                { sessionId }
            );

            break;

    }
}

module.exports = {
    executeCommand
};