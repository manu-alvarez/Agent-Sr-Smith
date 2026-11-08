import type { Task } from "../../core/domain/index.ts";

export interface Edge {
  from: string;
  to: string;
}

/** Edges point from dependency to dependent: the dependency must finish first. */
export function edgesOf(tasks: Task[]): Edge[] {
  const edges: Edge[] = [];
  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      edges.push({ from: dependency, to: task.id });
    }
  }
  return edges;
}

export function findCycle(tasks: Task[]): string[] | null {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const color = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    const state = color.get(id) ?? 0;
    if (state === 1) {
      const start = stack.indexOf(id);
      return [...stack.slice(start), id];
    }
    if (state === 2) return null;
    const task = byId.get(id);
    if (!task) return null;
    color.set(id, 1);
    stack.push(id);
    for (const dependency of task.dependencies) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    stack.pop();
    color.set(id, 2);
    return null;
  };

  for (const task of tasks) {
    const cycle = visit(task.id);
    if (cycle) return cycle;
  }
  return null;
}

export function topologicalOrder(tasks: Task[]): string[] {
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const task of tasks) {
    indegree.set(task.id, task.dependencies.length);
    outgoing.set(task.id, []);
  }
  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      outgoing.get(dependency)?.push(task.id);
    }
  }
  const queue = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id);
  const ordered: string[] = [];
  while (queue.length > 0) {
    queue.sort();
    const id = queue.shift();
    if (!id) break;
    ordered.push(id);
    for (const next of outgoing.get(id) ?? []) {
      const degree = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, degree);
      if (degree === 0) queue.push(next);
    }
  }
  if (ordered.length !== tasks.length) {
    throw new Error("Topological order failed because the graph has a cycle or a missing dependency.");
  }
  return ordered;
}

export function depthOf(tasks: Task[]): Record<string, number> {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const memo = new Map<string, number>();
  const depth = (id: string, trail: string[]): number => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (trail.includes(id)) return 0;
    const task = byId.get(id);
    if (!task || task.dependencies.length === 0) {
      memo.set(id, 0);
      return 0;
    }
    const value = 1 + Math.max(...task.dependencies.map((dependency) => depth(dependency, [...trail, id])));
    memo.set(id, value);
    return value;
  };
  const result: Record<string, number> = {};
  for (const task of tasks) result[task.id] = depth(task.id, []);
  return result;
}

export function missingDependencies(tasks: Task[]): string[] {
  const ids = new Set(tasks.map((task) => task.id));
  const missing = new Set<string>();
  for (const task of tasks) {
    for (const dependency of task.dependencies) {
      if (!ids.has(dependency)) missing.add(dependency);
    }
  }
  return [...missing];
}
