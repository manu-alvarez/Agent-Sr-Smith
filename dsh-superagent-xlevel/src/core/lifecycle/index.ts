import type { Phase, TaskStatus } from "../domain/index.ts";

export const PHASE_EDGES: Record<Phase, Phase[]> = {
  received: ["analysis", "failed"],
  analysis: ["planning", "blocked", "failed"],
  planning: ["policy_validation", "failed"],
  policy_validation: ["task_graph", "blocked", "failed"],
  task_graph: ["scheduling", "failed"],
  scheduling: ["delegation", "blocked", "failed"],
  delegation: ["execution", "blocked", "failed"],
  execution: ["verification", "recovery", "blocked", "failed"],
  verification: ["completed", "recovery", "blocked", "failed"],
  recovery: ["scheduling", "verification", "blocked", "failed"],
  completed: [],
  blocked: ["scheduling", "verification", "failed"],
  failed: [],
};

export function canTransition(from: Phase, to: Phase): boolean {
  return PHASE_EDGES[from].includes(to);
}

export function assertTransition(from: Phase, to: Phase): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal phase transition ${from} -> ${to}`);
  }
}

export const TASK_EDGES: Record<TaskStatus, TaskStatus[]> = {
  pending: ["ready", "blocked", "cancelled"],
  ready: ["running", "blocked", "cancelled"],
  running: ["completed", "failed", "blocked", "cancelled"],
  blocked: ["ready", "cancelled", "failed"],
  completed: [],
  failed: ["ready"],
  cancelled: [],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_EDGES[from].includes(to);
}

export const PHASE_ORDER: Phase[] = [
  "received",
  "analysis",
  "planning",
  "policy_validation",
  "task_graph",
  "scheduling",
  "delegation",
  "execution",
  "verification",
  "completed",
];

export function phaseIndex(phase: Phase): number {
  const index = PHASE_ORDER.indexOf(phase);
  return index === -1 ? PHASE_ORDER.length : index;
}
