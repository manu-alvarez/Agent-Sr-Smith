import type { ExecutionReport } from "../../core/domain/index.ts";

export function summarize(report: ExecutionReport) {
  return {
    status: report.status,
    tasks: report.tasks.length,
    completed: report.tasks.filter((task) => task.status === "completed").length,
    steps: report.usage.steps,
    events: report.events.length,
  };
}
