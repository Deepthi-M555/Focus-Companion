const FocusSession =
require("../models/FocusSession");

const activeUsers =
new Map();

module.exports = (

    io,

    socket

) => {

    /*
      User Connected
    */

    activeUsers.set(

        socket.user.userId,

        Date.now()

    );

    /*
      Heartbeat
    */

    socket.on(

        "heartbeat",

        async ({

            sessionId

        }) => {

            activeUsers.set(

                socket.user.userId,

                Date.now()

            );

            if (!sessionId) {

                return;

            }

            try {

                const session = await FocusSession.findById(sessionId);

                if (!session || String(session.user) !== String(socket.user.userId)) {
                    return;
                }

                await FocusSession.findByIdAndUpdate(

                    sessionId,

                    {

                        lastHeartbeatAt:
                            new Date()

                    }

                );

            } catch (error) {

                console.error(error);

            }

        }

    );

    /*
      User Disconnected
    */

    socket.on(

        "disconnect",

        () => {

            activeUsers.delete(

                socket.user.userId

            );

        }

    );

};
