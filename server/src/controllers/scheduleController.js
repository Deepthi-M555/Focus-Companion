const {
    loadActiveSchedule
} = require("../services/taskService");

const {
    generateSchedule
} = require("../services/schedulingService");

module.exports.generate = async (req, res) => {

    const tasks = await loadActiveSchedule(
        req.identity.userId
    );

    if (!tasks.length) {
        return res.json({
            schedule: []
        });
    }

    const schedule = generateSchedule(tasks);

    res.json({
        schedule
    });

};