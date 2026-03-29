export const generateSchedule = (parsedData) => {
  const { hours, tasks } = parsedData;

  if (!tasks || tasks.length === 0) return [];

  const timePerTask = hours / tasks.length;

  return tasks.map((task) => ({
    task,
    duration: Number(timePerTask.toFixed(2)),
  }));
};