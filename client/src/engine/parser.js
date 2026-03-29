export const parseInput = (text) => {
  const lower = text.toLowerCase();

  let hours = 1;

  // 🔥 FIX 1: support hr / hrs / hours
  const hourMatch = lower.match(/(\d+)\s*(hour|hours|hr|hrs)/);

  if (hourMatch) {
    hours = parseInt(hourMatch[1]);
  }

  let tasks = [];

  // 🔥 Case 1: "study X, Y"
  if (lower.includes("study")) {
    const part = text.split(/study/i)[1];
    tasks = part.split(",").map((t) => t.trim());
  }

  // 🔥 Case 2: "for X, Y"
  else if (lower.includes("for")) {
    const part = text.split(/for/i)[1];
    tasks = part.split(",").map((t) => t.trim());
  }

  // 🔥 Case 3: "complete 4 modules"
  else if (lower.includes("module")) {
    const numMatch = lower.match(/(\d+)\s*module/);

    if (numMatch) {
      const count = parseInt(numMatch[1]);

      // create generic tasks
      tasks = Array.from({ length: count }, (_, i) => `Module ${i + 1}`);
    }
  }

  // Clean empty values
  tasks = tasks.filter((t) => t.length > 0);

  return { hours, tasks };
};