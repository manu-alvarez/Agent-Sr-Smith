import type { ExecutionMode, ToolManifest, ToolResult } from "../core/domain/index.ts";
import { SCHEMA_VERSION } from "../core/domain/index.ts";
import { createId } from "../core/identifiers/index.ts";
import { authorize } from "../governance/authorization/index.ts";
import { scanUntrusted } from "../governance/safety/index.ts";
import type { OperationClass } from "../core/domain/index.ts";
import { explainPolicy } from "../governance/policies/index.ts";
import { searchKnowledge } from "../knowledge/retrieval/index.ts";
import type { VirtualSandbox } from "../workers/sandbox/index.ts";

export const NATIVE_TOOLS: ToolManifest[] = [
  tool("workspace.read", "Lee un archivo del sandbox virtual.", false, true, false, false),
  tool("workspace.write", "Escribe un archivo bajo sandbox/.", false, true, false, false),
  tool("knowledge.search", "Busca en el corpus local.", false, false, false, false),
  tool("policy.explain", "Explica las reglas de autonomía.", false, false, false, false),
  tool("memory.recall", "Recupera memoria local de la ejecución.", false, false, false, false),
  tool("memory.remember", "Guarda una nota de trabajo.", false, false, false, false),
];

function tool(
  name: string,
  description: string,
  network: boolean,
  filesystem: boolean,
  shell: boolean,
  requiresApproval: boolean,
): ToolManifest {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: `tol_${name}`,
    name,
    version: "1.0.0",
    description,
    source: { type: "native", identifier: name },
    inputSchema: { type: "object", additionalProperties: true },
    capabilities: [name],
    permissions: { network, filesystem, shell, requiresApproval },
    execution: { timeoutMs: 5_000, retryable: false, idempotent: name !== "workspace.write" },
  };
}

export interface ToolContext {
  mode: ExecutionMode;
  approvals: string[];
  sandbox: VirtualSandbox;
  memoryNotes: string[];
}

const OPERATION_BY_TOOL: Record<string, OperationClass> = {
  "workspace.read": "sandbox-read",
  "workspace.write": "sandbox-write",
  "knowledge.search": "analyze",
  "policy.explain": "analyze",
  "memory.recall": "analyze",
  "memory.remember": "analyze",
};

export function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
): ToolResult {
  const started = Date.now();
  const manifest = NATIVE_TOOLS.find((item) => item.name === name);
  const base = {
    schemaVersion: SCHEMA_VERSION,
    callId: createId("tol"),
    toolId: manifest?.id ?? `tol_${name}`,
    latencyMs: 0,
  };
  if (!manifest) {
    return { ...base, status: "failed", latencyMs: Date.now() - started, error: { code: "unknown_tool", message: `Herramienta no registrada: ${name}`, retryable: false } };
  }
  const scan = scanUntrusted(JSON.stringify(args));
  if (scan.flagged) {
    return {
      ...base,
      status: "denied",
      latencyMs: Date.now() - started,
      error: { code: "prompt_injection", message: `Argumentos marcados: ${scan.reasons.join(", ")}`, retryable: false },
    };
  }
  const operation = OPERATION_BY_TOOL[name] ?? "analyze";
  const auth = authorize({ operation, mode: context.mode, approvals: context.approvals });
  if (!auth.approved) {
    return {
      ...base,
      status: "denied",
      latencyMs: Date.now() - started,
      error: { code: "policy_denied", message: auth.reason, retryable: false },
    };
  }
  try {
    const output = dispatch(name, args, context);
    return { ...base, status: "completed", output, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ...base,
      status: "failed",
      latencyMs: Date.now() - started,
      error: { code: "tool_failed", message: error instanceof Error ? error.message : String(error), retryable: false },
    };
  }
}

function dispatch(name: string, args: Record<string, unknown>, context: ToolContext): unknown {
  if (name === "workspace.read") return context.sandbox.read(String(args.path ?? "README.md"));
  if (name === "workspace.write") {
    return context.sandbox.write(String(args.path ?? ""), String(args.content ?? ""));
  }
  if (name === "knowledge.search") return searchKnowledge(String(args.query ?? ""), 3);
  if (name === "policy.explain") return explainPolicy();
  if (name === "memory.recall") {
    const query = String(args.query ?? "").toLowerCase();
    return context.memoryNotes.filter((note) => note.toLowerCase().includes(query)).slice(0, 5);
  }
  if (name === "memory.remember") {
    const note = String(args.content ?? "").slice(0, 500);
    context.memoryNotes.push(note);
    return { stored: true };
  }
  throw new Error(`Sin implementación para ${name}`);
}
