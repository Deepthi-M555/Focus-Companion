const Analytics = require("../models/Analytics");

module.exports.getAnalytics = async (req, res) => {
    try {

        const analytics = await Analytics.findOne({
            userId: req.identity.userId
        });

        if (!analytics) {
            return res.status(404).json({
                message: "Analytics not found"
            });
        }

        res.json({
            stats: analytics.stats,
            weeklyData: analytics.weeklyData,
            trendData: analytics.trendData,
            insight: analytics.insight,
            productiveTime: analytics.productiveTime,
            averageSession: analytics.averageSession
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch analytics."
        });
    }
};