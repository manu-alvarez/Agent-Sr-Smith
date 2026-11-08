import type { Task } from "../../core/domain/index.ts";

export interface WorkerLease {
  taskId: string;
  role: string;
  sandboxRoot: "sandbox/";
}

export function lease(task: Task): WorkerLease {
  return { taskId: task.id, role: task.assignedRole ?? "planner", sandboxRoot: "sandbox/" };
}
