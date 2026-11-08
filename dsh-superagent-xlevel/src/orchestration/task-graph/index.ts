import type { ExecutionCheckpoint, Phase, Task, TaskGraphSnapshot, TaskStatus } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { CycleError } from "../../core/errors/index.ts";
import { checksum, createId, nowIso } from "../../core/identifiers/index.ts";
import { canTransitionTask } from "../../core/lifecycle/index.ts";
import { depthOf, edgesOf, findCycle, missingDependencies, topologicalOrder } from "../dependency-resolver/index.ts";

export class TaskGraph {
  private readonly tasks = new Map<string, Task>();

  constructor(tasks: Task[] = []) {
    for (const task of tasks) this.add(task);
    this.seal();
  }

  add(task: Task): void {
    if (this.tasks.has(task.id)) throw new Error(`Duplicate task ${task.id}`);
    this.tasks.set(task.id, {
      ...task,
      dependencies: [...task.dependencies],
      acceptanceCriteria: [...task.acceptanceCriteria],
      inputs: { ...task.inputs },
    });
  }

  seal(): void {
    const tasks = this.list();
    const missing = missingDependencies(tasks);
    if (missing.length > 0) {
      throw new Error(`Missing dependencies: ${missing.join(", ")}`);
    }
    const cycle = findCycle(tasks);
    if (cycle) throw new CycleError(cycle);
  }

  list(): Task[] {
    return [...this.tasks.values()].map((task) => ({
      ...task,
      dependencies: [...task.dependencies],
      acceptanceCriteria: [...task.acceptanceCriteria],
    }));
  }

  get(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw new Error(`Unknown task ${id}`);
    return task;
  }

  transition(id: string, status: TaskStatus, patch: Partial<Task> = {}): Task {
    const task = this.get(id);
    if (task.status !== status && !canTransitionTask(task.status, status)) {
      throw new Error(`Illegal task transition ${task.status} -> ${status} (${id})`);
    }
    const next: Task = { ...task, ...patch, status };
    this.tasks.set(id, next);
    return next;
  }

  ready(): Task[] {
    return this.list()
      .filter((task) => task.status === "pending" || task.status === "failed")
      .filter((task) => task.dependencies.every((dependency) => this.get(dependency).status === "completed"))
      .filter((task) => task.attempts <= task.budget.maxRetries);
  }

  open(): Task[] {
    return this.list().filter((task) => !["completed", "cancelled", "blocked"].includes(task.status));
  }

  order(): string[] {
    return topologicalOrder(this.list());
  }

  depths(): Record<string, number> {
    return depthOf(this.list());
  }

  snapshot(planId: string): TaskGraphSnapshot {
    return {
      schemaVersion: SCHEMA_VERSION,
      planId,
      tasks: this.list(),
      edges: edgesOf(this.list()),
      cycle: findCycle(this.list()),
    };
  }

  checkpoint(executionId: string, sequence: number, phase: Phase): ExecutionCheckpoint {
    const tasks = this.list();
    const state = {
      completedTaskIds: tasks.filter((task) => task.status === "completed").map((task) => task.id),
      pendingTaskIds: tasks.filter((task) => task.status !== "completed").map((task) => task.id),
      taskStatuses: Object.fromEntries(tasks.map((task) => [task.id, task.status])),
    };
    return {
      schemaVersion: SCHEMA_VERSION,
      id: createId("chk"),
      executionId,
      sequence,
      phase,
      state,
      createdAt: nowIso(),
      checksum: checksum(state),
    };
  }
}

export function verifyCheckpoint(checkpoint: ExecutionCheckpoint): boolean {
  return checksum(checkpoint.state) === checkpoint.checksum;
}
