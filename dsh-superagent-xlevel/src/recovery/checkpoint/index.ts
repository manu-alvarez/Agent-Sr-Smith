import { verifyCheckpoint } from "../../orchestration/task-graph/index.ts";
import type { ExecutionCheckpoint } from "../../core/domain/index.ts";

export { verifyCheckpoint };

export function restoreStatuses(checkpoint: ExecutionCheckpoint): Record<string, string> | { error: string } {
  if (!verifyCheckpoint(checkpoint)) return { error: "checksum inválido" };
  return checkpoint.state.taskStatuses;
}
