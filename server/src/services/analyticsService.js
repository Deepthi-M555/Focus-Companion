const FocusSession = require("../models/FocusSession");
const SessionEvent = require("../models/SessionEvent");

function calculateFocusIntegrity({
    focusedMinutes,
    plannedMinutes,
    distractions
}) {

    if (plannedMinutes === 0) {
        return 0;
    }

    const completion =
        (focusedMinutes / plannedMinutes) * 100;

    const penalty =
        Math.min(
            distractions * 3,
            30
        );

    return Math.max(
        0,
        Math.round(
            completion - penalty
        )
    );

}

async function getAnalytics(userId) {

    const sessions =
        await FocusSession.find({
            user: userId
        }).sort({
            startedAt: 1
        });

    const events =
        await SessionEvent.find({
            user: userId
        });

    /*
        Total Planned Minutes
    */

    const plannedMinutes =
        sessions.reduce(

            (sum, session) =>

                sum +
                session.plannedDuration,

            0

        );

    /*
        Total Focus Minutes
    */

    const focusedMinutes =
        sessions.reduce(

            (sum, session) =>

                sum +
                session.actualDuration,

            0

        );

    /*
        Completed Sessions
    */

    const completedSessions =
        sessions.filter(

            session =>

                session.status ===
                "completed"

        );

    /*
        Focus Hours
    */

    const focusHours =
        (
            focusedMinutes / 60
        ).toFixed(1);

    /*
        Distractions
    */

    const distractions =
        events.filter(

            event =>

                event.type ===
                "DISTRACTION"

        ).length;

    /*
        Focus Integrity
    */

    const focusIntegrity =
        calculateFocusIntegrity({

            focusedMinutes,

            plannedMinutes,

            distractions

        });

    /*
        Average Session
    */

    const averageSession =

        completedSessions.length === 0

            ? "0 mins"

            :

            `${Math.round(

                focusedMinutes /

                completedSessions.length

            )} mins`;

    /*
        Productive Time
    */

    const hourlyMap = {};

    completedSessions.forEach(

        session => {

            if (!session.startedAt) {
                return;
            }

            const hour =
                new Date(
                    session.startedAt
                ).getHours();

            hourlyMap[hour] =
                (hourlyMap[hour] || 0) + 1;

        }

    );

    let productiveHour = null;
    let maxCount = 0;

    Object.entries(hourlyMap)

        .forEach(

            ([hour, count]) => {

                if (count > maxCount) {

                    maxCount = count;

                    productiveHour =
                        Number(hour);

                }

            }

        );

    const productiveTime =

        productiveHour === null

            ? "No Data"

            : `${productiveHour}:00 - ${productiveHour + 1}:00`;

    /*
        Current Streak
    */

    const uniqueDays = [

        ...new Set(

            completedSessions.map(

                session =>

                    new Date(session.startedAt)

                        .toISOString()

                        .split("T")[0]

            )

        )

    ].sort(
        (a, b) =>

            new Date(b) - new Date(a)
    );

    let streak = 0;

    let expected = new Date();

    expected.setHours(0, 0, 0, 0);

    for (const day of uniqueDays) {

        const current =

            new Date(day);

        current.setHours(0, 0, 0, 0);

        const diff =

            (expected - current)

            / (1000 * 60 * 60 * 24);

        if (diff === 0) {

            streak++;

            expected.setDate(

                expected.getDate() - 1

            );

        }

        else {

            break;

        }

    }

    /*
        Weekly Hours
    */

    const weeklyMap = {};

    completedSessions.forEach(

        session => {

            const day =

                new Date(
                    session.startedAt
                )

                .toLocaleDateString(

                    "en-US",

                    {

                        weekday: "short"

                    }

                );

            weeklyMap[day] =

                (

                    weeklyMap[day] ||

                    0

                ) +

                session.actualDuration / 60;

        }

    );

    const order = [

        "Mon",

        "Tue",

        "Wed",

        "Thu",

        "Fri",

        "Sat",

        "Sun"

    ];

    const weeklyData =

        order.map(

            day => ({

                name: day,

                hours:

                    Number(

                        (

                            weeklyMap[day] ||

                            0

                        )

                        .toFixed(1)

                    )

            })

        );

    /*
        Trend Data
    */

    const trendData =

        weeklyData.map(

            day => ({

                day: day.name,

                score:

                    Math.min(

                        100,

                        Math.round(

                            day.hours *

                            20

                        )

                    )

            })

        );

    /*
        Insight
    */

    let insight =

        "Keep building consistent focus sessions.";

    if (focusIntegrity >= 90) {

        insight =
            "Excellent focus consistency. Keep maintaining your routine.";

    }

    else if (

        focusIntegrity >= 70

    ) {

        insight =
            "Good progress. Reducing distractions will improve your focus further.";

    }

    else {

        insight =
            "Your focus sessions are frequently interrupted. Try shorter sessions and fewer distractions.";

    }

    const timeline = events
        .sort(
            (a, b) =>
                new Date(a.createdAt) -
                new Date(b.createdAt)
        )
        .map(event => ({
            id: event._id,
            type: event.type,
            time: event.createdAt,
            metadata: event.metadata
        }));

    return {

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

        insight,

        timeline

    };

}

module.exports = {

    getAnalytics

};
