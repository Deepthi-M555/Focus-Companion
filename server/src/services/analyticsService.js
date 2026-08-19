const FocusSession =
    require("../models/FocusSession");

const SessionEvent =
    require("../models/SessionEvent");
const {
    getJson,
    setJson
} = require(
    "./cacheService"
);

function startOfDay(date) {

    const result =
        new Date(date);

    result.setHours(
        0,
        0,
        0,
        0
    );

    return result;
}


function endOfDay(date) {

    const result =
        new Date(date);

    result.setHours(
        23,
        59,
        59,
        999
    );

    return result;
}


function formatDateKey(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function calculateFocusIntegrity({
    focusedMinutes,
    plannedMinutes,
    distractions
}) {

    if (
        plannedMinutes <= 0
    ) {
        return 0;
    }

    const completion =
        (
            focusedMinutes /
            plannedMinutes
        ) * 100;

    const penalty =
        Math.min(
            distractions * 3,
            30
        );

    return Math.max(
        0,
        Math.min(
            100,
            Math.round(
                completion - penalty
            )
        )
    );
}


function calculateCurrentStreak(
    completedSessions
) {

    const completedDays =
        new Set();

    completedSessions.forEach(
        session => {

            if (
                !session.startedAt
            ) {
                return;
            }

            completedDays.add(
                formatDateKey(
                    new Date(
                        session.startedAt
                    )
                )
            );
        }
    );

    if (
        completedDays.size === 0
    ) {
        return 0;
    }

    const today =
        startOfDay(
            new Date()
        );

    const yesterday =
        new Date(today);

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    const todayKey =
        formatDateKey(today);

    const yesterdayKey =
        formatDateKey(yesterday);

    /*
     * A current streak can continue
     * from yesterday even if the user
     * has not completed today's session yet.
     */

    let cursor;

    if (
        completedDays.has(
            todayKey
        )
    ) {

        cursor =
            today;

    } else if (
        completedDays.has(
            yesterdayKey
        )
    ) {

        cursor =
            yesterday;

    } else {

        return 0;
    }

    let streak = 0;

    while (
        completedDays.has(
            formatDateKey(cursor)
        )
    ) {

        streak++;

        cursor =
            new Date(cursor);

        cursor.setDate(
            cursor.getDate() - 1
        );
    }

    return streak;
}


async function getAnalytics(
    userId
) {
    const cacheKey =
        `fynix:analytics:${userId}:current-week`;
    const cached =
        await getJson(
            cacheKey
        );

    if (cached) {

        console.log(
            "[ANALYTICS CACHE] HIT"
        );

        return cached;

    }

    console.log(
        "[ANALYTICS CACHE] MISS"
    );
    /*
     * =========================
     * CURRENT WEEK
     * =========================
     */

    const now =
        new Date();

    const weekStart =
        startOfDay(now);

    /*
     * Monday is the first day
     * of the analytics week.
     */

    const dayOfWeek =
        weekStart.getDay();

    const daysSinceMonday =
        dayOfWeek === 0
            ? 6
            : dayOfWeek - 1;

    weekStart.setDate(
        weekStart.getDate() -
        daysSinceMonday
    );

    const weekEnd =
        endOfDay(
            new Date(
                weekStart
            )
        );

    weekEnd.setDate(
        weekEnd.getDate() + 6
    );


    /*
     * =========================
     * WEEKLY SESSIONS
     * =========================
     */

    const weeklySessions =
        await FocusSession.find({

            user: userId,

            startedAt: {
                $gte: weekStart,
                $lte: weekEnd
            }

        }).sort({
            startedAt: 1
        });


    /*
     * Completed sessions only
     * contribute to focus analytics.
     */

    const weeklyCompletedSessions =
        weeklySessions.filter(
            session =>
                session.status ===
                "completed"
        );


    /*
     * =========================
     * ALL COMPLETED SESSIONS
     * =========================
     *
     * Used only for streak.
     */

    const allCompletedSessions =
        await FocusSession.find({

            user: userId,

            status: "completed",

            startedAt: {
                $ne: null
            }

        }).sort({
            startedAt: 1
        });


    /*
     * =========================
     * WEEKLY PLANNED MINUTES
     * =========================
     */

    const plannedMinutes =
        weeklySessions.reduce(

            (sum, session) =>

                sum +
                Number(
                    session.plannedDuration ||
                    0
                ),

            0
        );


    /*
     * =========================
     * WEEKLY COMPLETED MINUTES
     * =========================
     */

    const focusedMinutes =
        weeklyCompletedSessions.reduce(

            (sum, session) =>

                sum +
                Number(
                    session.actualDuration ||
                    0
                ),

            0
        );


    /*
     * =========================
     * WEEKLY EVENTS
     * =========================
     */

    const weeklyEvents =
        await SessionEvent.find({

            user: userId,

            createdAt: {
                $gte: weekStart,
                $lte: weekEnd
            }

        });


    /*
     * =========================
     * DISTRACTIONS
     * =========================
     */

    const distractions =
        weeklyEvents.filter(

            event =>
                event.type ===
                "DISTRACTION"

        ).length;


    /*
     * =========================
     * FOCUS INTEGRITY
     * =========================
     */

    const focusIntegrity =
        calculateFocusIntegrity({

            focusedMinutes,

            plannedMinutes,

            distractions

        });


    /*
     * =========================
     * FOCUS HOURS
     * =========================
     */

    const focusHours =
        (
            focusedMinutes / 60
        ).toFixed(2);


    /*
     * =========================
     * AVERAGE SESSION
     * =========================
     */

    const averageSession =

        weeklyCompletedSessions.length === 0

            ? "0 mins"

            :

            `${Math.round(

                focusedMinutes /

                weeklyCompletedSessions.length

            )} mins`;


    /*
     * =========================
     * PRODUCTIVE TIME
     * =========================
     */

    const hourlyMap = {};


    weeklyCompletedSessions.forEach(
        session => {

            if (
                !session.startedAt
            ) {
                return;
            }
            const hour =
                new Date(
                    session.startedAt
                ).getHours();
            hourlyMap[hour] =
                (
                    hourlyMap[hour] ||
                    0
                ) + 1;
        }
    );
    let productiveHour =
        null;
    let maxCount =
        0;

    Object.entries(
        hourlyMap
    ).forEach(
        ([hour, count]) => {
            if (
                count >
                maxCount
            ) {
                maxCount =
                    count;

                productiveHour =
                    Number(hour);
            }
        }
    );
    const productiveTime =
        productiveHour === null
            ? "No Data"
            : `${String(
                productiveHour
            ).padStart(2, "0")}:00 - ${String(
                productiveHour + 1
            ).padStart(2, "0")}:00`;
    /*
     * =========================
     * CURRENT STREAK
     * =========================
     */
    const streak =
        calculateCurrentStreak(
            allCompletedSessions
        );
    /*
     * =========================
     * DAILY WEEKLY DATA
     * =========================
     */
    const dayNames = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ];

    const dailyMap = {};

    for (
        let i = 0;
        i < 7;
        i++
    ) {
        const day =
            new Date(
                weekStart
            );
        day.setDate(
            weekStart.getDate() +
            i
        );
        const key =
            formatDateKey(day);
        dailyMap[key] = {
            name:
                dayNames[i],
            plannedMinutes:
                0,
            focusedMinutes:
                0,
            distractions:
                0
        };
    }

    weeklySessions.forEach(
        session => {
            if (
                !session.startedAt
            ) {
                return;
            }
            const date =
                new Date(
                    session.startedAt
                );
            const key =
                formatDateKey(date);
            if (
                !dailyMap[key]
            ) {
                return;
            }
            dailyMap[key]
                .plannedMinutes +=
                Number(
                    session.plannedDuration ||
                    0
                );
            if (
                session.status ===
                "completed"
            ) {
                dailyMap[key]
                    .focusedMinutes +=
                    Number(
                        session.actualDuration ||
                        0
                    );
            }
        }
    );

    weeklyEvents.forEach(
        event => {
            const key =
                formatDateKey(
                    new Date(
                        event.createdAt
                    )
                );
            if (
                dailyMap[key] &&
                event.type ===
                "DISTRACTION"
            ) {
                dailyMap[key]
                    .distractions += 1;
            }
        }
    );
    const weeklyData =
        Object.values(
            dailyMap
        ).map(
            day => ({
                name:
                    day.name,
                hours:
                    Number(
                        (
                            day.focusedMinutes /
                            60
                        ).toFixed(2)
                    )
            })
        );
    /*
     * =========================
     * DAILY FOCUS TREND
     * =========================
     */
    const trendData =
        Object.values(
            dailyMap
        ).map(
            day => {
                const completion =
                    day.plannedMinutes > 0
                        ? (
                            day.focusedMinutes /
                            day.plannedMinutes
                        ) * 100
                        : 0;

                const score =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            Math.round(
                                completion -
                                Math.min(
                                    day.distractions * 3,
                                    30
                                )
                            )
                        )
                    );
                return {
                    day:
                        day.name,
                    score
                };

            }
        );
    /*
     * =========================
     * INSIGHT
     * =========================
     */
    let insight =
        "Keep building consistent focus sessions.";
    if (
        focusIntegrity >= 90
    ) {
        insight =
            "Excellent focus consistency. Keep maintaining your routine.";
    } else if (
        focusIntegrity >= 70
    ) {
        insight =
            "Good progress. Reducing distractions will improve your focus further.";
    } else if (
        focusedMinutes > 0
    ) {
        insight =
            "Your focus sessions are frequently interrupted. Try shorter sessions and fewer distractions.";
    }
    const analytics = {

        stats: {

            focusHours,

            focusIntegrity,

            streak,

            distractions

        },

        weeklyData,

        trendData,

        productiveTime,

        averageSession,

        insight

        };


    await setJson(
        cacheKey,
        analytics,
        30
    );


    return analytics;
}

module.exports = {
    getAnalytics
};