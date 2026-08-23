module.exports = (
    io,
    socket
) => {

    socket.on(
        "join_focus_session",

        (sessionId) => {

            socket.join(
                sessionId
            );

            console.log(
                `Joined session: ${sessionId}`
            );

        }
    );

};