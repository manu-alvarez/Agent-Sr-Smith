import type { ToolManifest } from "../../core/domain/index.ts";

export function normalizeMcpTool(input: {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}): ToolManifest {
  return {
    schemaVersion: "1.0.0",
    id: `tol_${input.name}`,
    name: input.name,
    version: "mcp",
    description: input.description,
    source: { type: "mcp", identifier: input.name },
    inputSchema: input.inputSchema,
    capabilities: [input.name],
    permissions: { network: false, filesystem: false, shell: false, requiresApproval: true },
    execution: { timeoutMs: 10_000, retryable: false, idempotent: false },
  };
}
