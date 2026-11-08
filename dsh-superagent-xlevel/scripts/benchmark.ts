import { runObjective } from "../src/public.ts";

const started = Date.now();
const report = runObjective({
  objective: "Implement a durable checkpoint store with checksum verification and resume.",
  profileId: "engineering",
});
const elapsed = Date.now() - started;
console.log(JSON.stringify({
  status: report.status,
  tasks: report.tasks.length,
  completed: report.tasks.filter((task) => task.status === "completed").length,
  steps: report.usage.steps,
  elapsedMs: elapsed,
}, null, 2));
