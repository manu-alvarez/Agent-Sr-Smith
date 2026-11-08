import type { AgentResult } from "../../core/domain/index.ts";
export function acceptable(result: AgentResult): boolean {
  return result.status === "completed" && result.evidence.length > 0 && result.summary.length > 0;
}
