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

  const elasticTasks =
    tasks.filter(
      task =>
        task.type ===
        "ELASTIC"
    );

  const inelasticTasks =
    tasks.filter(
      task =>
        task.type ===
        "INELASTIC"
    );

  const schedule =
    generateSchedule({

      elasticTasks,

      inelasticTasks,

      dayStart:
        new Date(),

      dayEnd:
        new Date()

    });

  res.json(schedule);

};