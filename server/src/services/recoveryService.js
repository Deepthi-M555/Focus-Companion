function recoverSchedule({

  remainingTasks,

  availableMinutes

}) {

  /*
    Total Remaining Work
  */

  const totalWork =
    remainingTasks.reduce(

      (sum, task) =>

        sum +
        task.estimatedDuration,

      0
    );

  /*
    Overflow Detection
  */

  if (
    totalWork >
    availableMinutes
  ) {

    /*
      Compress Low Priority
    */

    remainingTasks.sort(
      (a, b) =>
        a.priority - b.priority
    );

    for (
      const task
      of remainingTasks
    ) {

      task.estimatedDuration =
        Math.floor(
          task.estimatedDuration
          * 0.8
        );

    }

  }

  return remainingTasks;

}

module.exports = {
  recoverSchedule
};