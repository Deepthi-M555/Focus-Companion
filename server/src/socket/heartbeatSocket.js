const FocusSession =
    require("../models/FocusSession");

const {
    redisClient
} = require("../config/redis");


const PRESENCE_TTL_SECONDS = 45;


function presenceKey(userId) {

    return `fynix:presence:user:${userId}`;

}


async function markUserOnline(
    userId,
    socketId
) {

    try {

        if (!redisClient.isReady) {

            console.error(
                "[PRESENCE] Redis is NOT ready"
            );

            return;

        }

        const key =
            presenceKey(userId);

        const now =
            Date.now();

        console.log(
            "[PRESENCE] ONLINE START",
            {
                userId,
                socketId,
                key,
                redisReady:
                    redisClient.isReady
            }
        );

        const result =
            await redisClient.zAdd(
                key,
                [
                    {
                        score: now,
                        value: socketId
                    }
                ]
            );

        console.log(
            "[PRESENCE] ZADD RESULT:",
            result
        );

        /*
         * Remove stale sockets.
         */

        await redisClient.zRemRangeByScore(
            key,
            0,
            now -
            (
                PRESENCE_TTL_SECONDS *
                1000
            )
        );

        /*
         * Keep the presence key alive.
         */

        await redisClient.expire(
            key,
            PRESENCE_TTL_SECONDS
        );

        /*
         * VERIFY immediately.
         */

        const count =
            await redisClient.zCard(
                key
            );

        console.log(
            "[PRESENCE] ZCARD AFTER ZADD:",
            {
                key,
                count
            }
        );

    } catch (error) {

        console.error(
            "[PRESENCE] markUserOnline FAILED:",
            error
        );

    }

}


async function markUserOffline(
    userId,
    socketId
) {

    try {

        if (!redisClient.isReady) {

            console.warn(
                "[PRESENCE] Redis not ready during offline"
            );

            return;

        }

        const key =
            presenceKey(userId);

        console.log(
            "[PRESENCE] OFFLINE:",
            {
                userId,
                socketId,
                key
            }
        );

        await redisClient.zRem(
            key,
            socketId
        );

        const count =
            await redisClient.zCard(
                key
            );

        if (
            count === 0
        ) {

            await redisClient.del(
                key
            );

        }

    } catch (error) {

        console.error(
            "[PRESENCE] markUserOffline FAILED:",
            error
        );

    }

}


async function isUserOnline(
    userId
) {

    try {

        if (!redisClient.isReady) {

            return false;

        }

        const key =
            presenceKey(userId);

        const now =
            Date.now();

        await redisClient.zRemRangeByScore(
            key,
            0,
            now -
            (
                PRESENCE_TTL_SECONDS *
                1000
            )
        );

        return (
            await redisClient.zCard(
                key
            )
        ) > 0;

    } catch (error) {

        console.error(
            "[PRESENCE] isUserOnline FAILED:",
            error
        );

        return false;

    }

}


module.exports = (
    io,
    socket
) => {

    console.log(
        "[PRESENCE] Registering presence handler:",
        {
            socketId: socket.id,
            user: socket.user
        }
    );


    /*
     * Initial presence.
     */

    const userId =
        String(
            socket.user.userId
        );

    console.log(
        "[PRESENCE] Socket authenticated:",
        {
            userId,
            socketId: socket.id
        }
    );


    markUserOnline(
        userId,
        socket.id
    );


    /*
     * Heartbeat.
     */

    socket.on(
        "heartbeat",
        async ({
            sessionId
        } = {}) => {

            console.log(
                "[PRESENCE] HEARTBEAT RECEIVED:",
                {
                    userId,
                    socketId: socket.id,
                    sessionId
                }
            );

            try {

                await markUserOnline(
                    userId,
                    socket.id
                );

                if (!sessionId) {

                    return;

                }

                const session =
                    await FocusSession.findById(
                        sessionId
                    );

                if (
                    !session ||
                    String(
                        session.user
                    ) !== userId
                ) {

                    return;

                }

                await FocusSession
                    .findByIdAndUpdate(
                        sessionId,
                        {
                            lastHeartbeatAt:
                                new Date()
                        }
                    );

            } catch (error) {

                console.error(
                    "[HEARTBEAT] FAILED:",
                    error
                );

            }

        }
    );


    /*
     * Disconnect.
     */

    socket.on(
        "disconnect",
        () => {

            console.log(
                "[PRESENCE] DISCONNECT:",
                {
                    userId,
                    socketId: socket.id
                }
            );

            markUserOffline(
                userId,
                socket.id
            );

        }
    );

};


module.exports.isUserOnline =
    isUserOnline;