import type { ExecutionReport } from "../../core/domain/index.ts";

export function diagnoseReport(report: ExecutionReport): string[] {
  const notes: string[] = [];
  if (report.watchdog.loops.length) notes.push("bucle de agenda");
  if (report.watchdog.budgetExhausted) notes.push("presupuesto agotado");
  if (report.watchdog.deviations.length) notes.push(`desviaciones: ${report.watchdog.deviations.join(",")}`);
  if (!report.verification.accepted) notes.push("verificación no aceptada");
  return notes;
}
