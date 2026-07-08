const Task =
require("../models/Task");

const {
  generateSchedule
} =
require("../services/schedulingService");

module.exports.generate =
async (req, res) => {

  const tasks =
    await Task.find({

      userId:
        req.identity.userId

    });

  if (!tasks.length) {
    return res.json({
      schedule: []
    });
  }

  const schedule =
    generateSchedule(tasks);

  res.json({ schedule });

};
