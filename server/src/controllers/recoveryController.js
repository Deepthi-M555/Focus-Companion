const {
  recoverSchedule,
  regenerateRecoverySchedule,
  resumeFromRecovery,
  skipAndResume,
  getRecoverySummary
} =
require("../services/recoveryService");

const Task = require("../models/Task");

module.exports.recover =
async (req, res) => {

  const userId = req.identity?.userId;
  const action =
    String(req.body?.action || req.body?.reason || "recover")
      .toLowerCase();

  if (action === "resume") {
    const resumed = await resumeFromRecovery({
      userId,
      clientType: req.body.clientType || req.identity?.clientType || "WEB",
      userMode: req.body.mode || "gentle"
    });
    return res.json(resumed);
  }

  if (action === "regenerate") {
    const regenerated = await regenerateRecoverySchedule({
      userId,
      remainingTasks: req.body?.remainingTasks,
      extraMinutes: req.body?.extraMinutes || 0
    });

    return res.json(regenerated);
  }

  const remainingTasks = req.body?.remainingTasks ||
    await Task.find({
      userId,
      completed: false
    });

  const recovered = recoverSchedule({
    remainingTasks,
    availableMinutes: req.body?.availableMinutes ?? 480
  });

  await Promise.all(
    recovered.tasks
      .filter(task => typeof task.save === "function")
      .map(task => task.save())
  );

  res.json(recovered);

};

module.exports.skipAndResume =
async (req, res, next) => {

  try {
    const result = await skipAndResume({
      userId: req.identity?.userId,
      clientType: req.body?.clientType || "WEB"
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }

};

module.exports.summary =
async (req, res, next) => {

  try {
    const result = await getRecoverySummary({
      userId: req.identity?.userId
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }

};
