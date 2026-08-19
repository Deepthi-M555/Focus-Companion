const {
    redisClient
} = require(
    "../config/redis"
);


async function getJson(
    key
) {

    try {

        if (
            !redisClient.isReady
        ) {

            return null;

        }

        const value =
            await redisClient.get(
                key
            );

        if (!value) {

            return null;

        }

        return JSON.parse(
            value
        );

    } catch (
        error
    ) {

        console.error(
            "[CACHE GET]",
            error
        );

        return null;

    }

}


async function setJson(
    key,
    value,
    ttlSeconds = 30
) {

    try {

        if (
            !redisClient.isReady
        ) {

            return;

        }

        await redisClient.set(
            key,
            JSON.stringify(value),
            {
                EX: ttlSeconds
            }
        );

    } catch (
        error
    ) {

        console.error(
            "[CACHE SET]",
            error
        );

    }

}


async function deleteKey(
    key
) {

    try {

        if (
            !redisClient.isReady
        ) {

            return;

        }

        await redisClient.del(
            key
        );

    } catch (
        error
    ) {

        console.error(
            "[CACHE DELETE]",
            error
        );

    }

}
async function invalidateAnalytics(
    userId
) {

    await deleteKey(
        `fynix:analytics:${userId}:current-week`
    );

}

module.exports = {

    getJson,

    setJson,

    deleteKey,
    
    invalidateAnalytics

};