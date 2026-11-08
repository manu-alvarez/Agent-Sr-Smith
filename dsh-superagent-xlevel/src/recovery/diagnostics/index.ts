import type { RecoveryPlan, Task } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { createId, nowIso } from "../../core/identifiers/index.ts";

export function diagnose(executionId: string, tasks: Task[], budgetRemaining: number): RecoveryPlan {
  const failed = tasks.filter((task) => task.status === "failed");
  const blocked = tasks.filter((task) => task.status === "blocked");
  const actions: RecoveryPlan["actions"] = [];
  for (const task of failed) {
    if (task.attempts <= task.budget.maxRetries && budgetRemaining > 0) {
      actions.push({ kind: "retry", taskId: task.id, reason: task.blockedReason ?? "La evidencia no cubrió los criterios." });
    } else {
      actions.push({ kind: "escalate", taskId: task.id, reason: "Presupuesto de reintento agotado." });
    }
  }
  for (const task of blocked) {
    actions.push({
      kind: "escalate",
      taskId: task.id,
      reason: task.blockedReason ?? "Bloqueada por política o aprobación.",
    });
  }
  if (actions.length === 0) {
    actions.push({ kind: "replan", reason: "No hay tarea fallida concreta; hace falta un plan nuevo." });
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId("rec"),
    executionId,
    diagnosis: failed.length
      ? `${failed.length} tarea(s) fallida(s), ${blocked.length} bloqueada(s).`
      : blocked.length
        ? `${blocked.length} tarea(s) bloqueada(s) por política.`
        : "Sin fallo de tarea; revisar criterios globales.",
    actions,
    budgetRemaining,
    createdAt: nowIso(),
  };
}
