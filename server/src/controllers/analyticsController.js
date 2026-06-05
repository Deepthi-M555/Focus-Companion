const Analytics =
require("../models/Analytics");

module.exports.getAnalytics =
async (req, res) => {

  const analytics =
    await Analytics.findOne({

      userId:
        req.identity.userId

    });

  res.json(analytics);

};