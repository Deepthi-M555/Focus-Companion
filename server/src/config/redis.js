const {
    createClient
} = require("redis");

const {
    createAdapter
} = require(
    "@socket.io/redis-adapter"
);


const redisUrl =
    process.env.REDIS_URL ||
    "redis://127.0.0.1:6379";


function createRedisClient(
    name
) {

    const client =
        createClient({
            url: redisUrl
        });

    client.on(
        "error",
        error => {

            console.error(
                `[REDIS:${name}]`,
                error
            );

        }
    );

    client.on(
        "connect",
        () => {

            console.log(
                `[REDIS:${name}] connecting`
            );

        }
    );

    client.on(
        "ready",
        () => {

            console.log(
                `[REDIS:${name}] ready`
            );

        }
    );

    client.on(
        "reconnecting",
        () => {

            console.log(
                `[REDIS:${name}] reconnecting`
            );

        }
    );

    return client;
}


/*
 * General-purpose Redis client.
 *
 * Used for:
 *
 * - cache
 * - locks
 * - presence
 * - rate limiting
 */

const redisClient =
    createRedisClient(
        "GENERAL"
    );


/*
 * Socket.IO publisher.
 */

const pubClient =
    createRedisClient(
        "PUB"
    );


/*
 * Socket.IO subscriber.
 */

const subClient =
    createRedisClient(
        "SUB"
    );


async function connectRedis() {

    await Promise.all([

        redisClient.connect(),

        pubClient.connect(),

        subClient.connect()

    ]);

    console.log(
        "[REDIS] All clients connected"
    );

}


async function disconnectRedis() {

    const clients = [
        redisClient,
        pubClient,
        subClient
    ];

    await Promise.all(
        clients.map(
            async client => {

                if (
                    client.isOpen
                ) {

                    await client.quit();

                }

            }
        )
    );

}


function configureSocketRedis(
    io
) {

    io.adapter(
        createAdapter(
            pubClient,
            subClient
        )
    );

    console.log(
        "[REDIS] Socket.IO Redis adapter enabled"
    );

}


module.exports = {

    redisClient,

    pubClient,

    subClient,

    connectRedis,

    disconnectRedis,

    configureSocketRedis

};