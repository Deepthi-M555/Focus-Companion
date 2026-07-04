function buildTimeline(
  tasks
) {

  if (!tasks.length) {
    return [];
  }

  const hasLinks =
    tasks.some(
      task => task.precedingTaskId
    );

  if (!hasLinks) {
    return [...tasks].sort(
      (a, b) =>
        (a.sequenceOrder || 0) -
        (b.sequenceOrder || 0)
    );
  }

  const ordered = [];

  let current =
    tasks.find(
      task =>
        !task.precedingTaskId
    );

  while (current) {

    ordered.push(current);

    current =
      tasks.find(

        task =>

          String(
            task.precedingTaskId
          ) ===

          String(
            current._id
          )

      );

  }

  const linkedIds =
    new Set(
      ordered.map(task => String(task._id))
    );

  const unlinked =
    tasks
      .filter(task => !linkedIds.has(String(task._id)))
      .sort(
        (a, b) =>
          (a.sequenceOrder || 0) -
          (b.sequenceOrder || 0)
      );

  return [...ordered, ...unlinked];

}

module.exports = {
  buildTimeline
};



/*WHAT THIS DOES

Builds:

Task A
↓
Task B
↓
Task C

runtime schedule sequence.

THIS is:

graph traversal scheduling.

VERY advanced architecture.*/
