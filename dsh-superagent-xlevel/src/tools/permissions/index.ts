import type { ExecutionMode, ToolManifest } from "../../core/domain/index.ts";
import { authorize } from "../../governance/authorization/index.ts";

export function permit(manifest: ToolManifest, mode: ExecutionMode, approvals: string[]) {
  const operation = manifest.permissions.network
    ? "network"
    : manifest.permissions.shell
      ? "sandbox-write"
      : manifest.permissions.filesystem
        ? "sandbox-read"
        : "analyze";
  return authorize({ operation, mode, approvals });
}
