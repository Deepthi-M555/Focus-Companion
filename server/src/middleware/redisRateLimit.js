const {
    redisClient
} = require(
    "../config/redis"
);

const ExpressError =
    require(
        "../utils/ExpressError"
    );


function redisRateLimit({

    windowSeconds = 60,

    maxRequests = 120,

    keyPrefix = "api",

    keyGenerator

} = {}) {

    return async (
        req,
        res,
        next
    ) => {

        try {

            if (
                !redisClient.isReady
            ) {

                /*
                 * Redis is unavailable.
                 *
                 * Do not take the whole
                 * application down merely
                 * because rate limiting
                 * is unavailable.
                 */

                return next();

            }

            const identity =
                keyGenerator
                    ? keyGenerator(req)
                    : req.ip;

            const key =
                `fynix:ratelimit:${keyPrefix}:${identity}`;

            const count =
                await redisClient.incr(
                    key
                );

            if (
                count === 1
            ) {

                await redisClient.expire(
                    key,
                    windowSeconds
                );

            }

            const ttl =
                await redisClient.ttl(
                    key
                );

            res.setHeader(
                "X-RateLimit-Limit",
                maxRequests
            );

            res.setHeader(
                "X-RateLimit-Remaining",
                Math.max(
                    0,
                    maxRequests -
                    count
                )
            );

            res.setHeader(
                "X-RateLimit-Reset",
                ttl
            );

            if (
                count >
                maxRequests
            ) {

                return next(
                    new ExpressError(
                        429,
                        "Too many requests. Please try again later."
                    )
                );

            }

            next();

        } catch (
            error
        ) {

            console.error(
                "[RATE LIMIT]",
                error
            );

            /*
             * Rate limiting should not
             * make FYNIX unavailable.
             */

            next();

        }

    };

}


module.exports =
    redisRateLimit;