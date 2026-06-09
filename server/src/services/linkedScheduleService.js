function buildTimeline(
  tasks
) {

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

  return ordered;

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