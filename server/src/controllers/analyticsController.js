const analyticsService =
require("../services/analyticsService");

module.exports.getAnalytics =
async (req, res) => {

    const analytics =

        await analyticsService.getAnalytics(

            req.identity.userId

        );

    res.json(analytics);

};