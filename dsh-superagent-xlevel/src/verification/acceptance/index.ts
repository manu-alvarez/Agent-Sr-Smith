import type { Task, VerificationCheck, VerificationReport } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { createId, nowIso } from "../../core/identifiers/index.ts";

export function verifyTasks(executionId: string, tasks: Task[], planCriteria: string[]): VerificationReport {
  const checks: VerificationCheck[] = [];
  for (const task of tasks) {
    const evidence = evidenceOf(task);
    for (const criterion of task.acceptanceCriteria) {
      const match = evidence.find((item) => overlaps(item, criterion) || item.length > 24);
      const passed = task.status === "completed" && Boolean(match) && evidence.length >= Math.min(2, task.acceptanceCriteria.length);
      checks.push({
        id: `${task.id}:${checks.length}`,
        criterion: `${task.title}: ${criterion}`,
        passed,
        evidence: match ?? "Sin evidencia independiente.",
      });
    }
  }
  for (const criterion of planCriteria) {
    const supporting = tasks.filter((task) => task.status === "completed");
    checks.push({
      id: `plan:${checks.length}`,
      criterion,
      passed: supporting.length === tasks.filter((task) => task.status !== "cancelled").length && tasks.every((task) => task.status !== "failed"),
      evidence: `${supporting.length} tareas completadas de ${tasks.length}.`,
    });
  }
  const accepted = checks.every((check) => check.passed);
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId("ver"),
    executionId,
    accepted,
    checks,
    reviewer: "agt_evaluator",
    summary: accepted ? "Los criterios tienen evidencia y no hay tareas fallidas." : "La verificación independiente no acepta el resultado.",
    createdAt: nowIso(),
  };
}

function evidenceOf(task: Task): string[] {
  const outputs = task.outputs ?? {};
  const fromOutput = outputs.evidence;
  if (Array.isArray(fromOutput)) return fromOutput.map(String);
  return [];
}

function overlaps(evidence: string, criterion: string): boolean {
  const words = new Set(
    criterion
      .toLowerCase()
      .split(/[^a-záéíóúñ0-9]+/i)
      .filter((word) => word.length > 4),
  );
  const hits = evidence
    .toLowerCase()
    .split(/[^a-záéíóúñ0-9]+/i)
    .filter((word) => words.has(word)).length;
  return hits >= 1;
}
