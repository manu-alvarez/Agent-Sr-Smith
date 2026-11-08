import type { WorkspaceChange, WorkspaceFile } from "../../core/domain/index.ts";

export function rollback(files: WorkspaceFile[], changes: WorkspaceChange[]): WorkspaceFile[] {
  const map = new Map(files.map((file) => [file.path, file.content]));
  for (const change of [...changes].reverse()) {
    if (change.op === "write") {
      if (change.before === undefined) map.delete(change.path);
      else map.set(change.path, change.before);
    }
    if (change.op === "delete" && change.before !== undefined) map.set(change.path, change.before);
  }
  return [...map.entries()].map(([path, content]) => ({ path, content }));
}
