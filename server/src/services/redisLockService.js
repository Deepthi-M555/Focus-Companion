const crypto =
    require("crypto");

const {
    redisClient
} = require("../config/redis");


async function acquireLock(
    key,
    ttlSeconds = 10
) {

    const token =
        crypto.randomUUID();

    const result =
        await redisClient.set(
            key,
            token,
            {
                NX: true,
                EX: ttlSeconds
            }
        );

    if (
        result !== "OK"
    ) {

        return null;

    }

    return token;

}


async function releaseLock(
    key,
    token
) {

    if (!token) {
        return;
    }

    const script = `
        if redis.call(
            "GET",
            KEYS[1]
        ) == ARGV[1]
        then
            return redis.call(
                "DEL",
                KEYS[1]
            )
        else
            return 0
        end
    `;

    await redisClient.sendCommand([
        "EVAL",
        script,
        "1",
        key,
        token
    ]);

}


module.exports = {

    acquireLock,

    releaseLock

};