function generateSchedule(
  tasks
) {

  /*
    Split Tasks
  */

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

  /*
    Sort Elastic Tasks
    by priority
  */

  elasticTasks.sort(
    (a, b) =>
      b.priority - a.priority
  );

  /*
    Day Start
  */

  let currentTime =
    new Date();

  const schedule = [];

  /*
    Allocate Elastic Tasks
  */

  for (const task of elasticTasks) {

    const startTime =
      new Date(currentTime);

    const endTime =
      new Date(
        currentTime.getTime() +
        task.estimatedDuration
        * 60000
      );

    schedule.push({

      title: task.title,

      startTime,

      endTime,

      priority:
        task.priority

    });

    /*
      MICRO BREAK
      5 mins
    */

    currentTime =
      new Date(
        endTime.getTime() +
        5 * 60000
      );

  }

  return {

    inelasticTasks,
    schedule

  };

}

module.exports = {
  generateSchedule
};