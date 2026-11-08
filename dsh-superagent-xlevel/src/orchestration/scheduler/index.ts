import type { Task } from "../../core/domain/index.ts";

export interface ScheduleBatch {
  index: number;
  taskIds: string[];
}

/** Stable parallel batches: ready tasks grouped, capped by maxParallel. */
export function batchReady(tasks: Task[], maxParallel: number): ScheduleBatch[] {
  const batches: ScheduleBatch[] = [];
  const queue = [...tasks].sort((a, b) => a.id.localeCompare(b.id));
  let index = 0;
  while (queue.length > 0) {
    const slice = queue.splice(0, Math.max(1, maxParallel));
    batches.push({ index, taskIds: slice.map((task) => task.id) });
    index += 1;
  }
  return batches;
}
