export const parseInput = (text) => {
  const lower = text.toLowerCase();

  let hours = 1;

  const hourMatch = lower.match(/(\d+)\s*hour/);
  if (hourMatch) {
    hours = parseInt(hourMatch[1]);
  }

  const tasks = [];

  if (lower.includes("os")) tasks.push("Operating Systems");
  if (lower.includes("dbms")) tasks.push("DBMS");
  if (lower.includes("math")) tasks.push("Math");

  return {
    hours,
    tasks,
  };
};