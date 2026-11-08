import {
  CAPABILITIES,
  DEFAULT_POLICY,
  NATIVE_TOOLS,
  PHASE_ORDER,
  PROFILES,
  ROLES,
} from "../../dsh-superagent-xlevel/src/public.ts";

export type AgentMode = "strict-local" | "local-runtime";

export interface AgentSelection {
  roles: string[];
  tools: string[];
  providers: string[];
  mode: AgentMode;
  limits: { maxSteps: number; maxParallel: number; timeoutMs: number };
}

const fullProfile = PROFILES.find((item) => item.id === "full") ?? PROFILES[0]!;

export const AGENT_LIMITS = fullProfile.limits;

export function fullSelection(): AgentSelection {
  return {
    roles: ROLES.map((item) => item.role),
    tools: NATIVE_TOOLS.map((item) => item.name),
    providers: CAPABILITIES.map((item) => item.provider),
    mode: "strict-local",
    limits: { ...AGENT_LIMITS },
  };
}

function uniqueKnown(values: string[], allowed: string[]): string[] {
  const known = new Set(allowed);
  return [...new Set(values.filter((value) => known.has(value)))];
}

export function clampSelection(input: AgentSelection): AgentSelection {
  const limits = {
    maxSteps: clamp(input.limits.maxSteps, 1, AGENT_LIMITS.maxSteps),
    maxParallel: clamp(input.limits.maxParallel, 1, AGENT_LIMITS.maxParallel),
    timeoutMs: clamp(input.limits.timeoutMs, 1_000, AGENT_LIMITS.timeoutMs),
  };
  return {
    roles: uniqueKnown(input.roles, ROLES.map((item) => item.role)),
    tools: uniqueKnown(input.tools, NATIVE_TOOLS.map((item) => item.name)),
    providers: uniqueKnown(input.providers, CAPABILITIES.map((item) => item.provider)),
    mode: input.mode === "local-runtime" ? "local-runtime" : "strict-local",
    limits,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function agentSystem(selection: AgentSelection): string {
  const chosen = clampSelection(selection);
  const roles = ROLES.filter((item) => chosen.roles.includes(item.role));
  const tools = NATIVE_TOOLS.filter((item) => chosen.tools.includes(item.name));
  const providers = CAPABILITIES.filter((item) => chosen.providers.includes(item.provider));
  const roleLines = roles.map((item) => `- ${item.name} (${item.role}): ${item.mission}`).join("\n");
  const toolLines = tools.map((item) => `- ${item.name}: ${item.description}`).join("\n");
  const providerLines = providers
    .map((item) => {
      const verified = item.verified ? "verificado" : "no verificado";
      return `- ${item.provider} / ${item.modelId}: ${item.name}. Estado: ${verified}. ${item.restrictions.join(" ")}`;
    })
    .join("\n");
  const network =
    chosen.mode === "strict-local"
      ? "La red está denegada. Los proveedores remotos quedan declarados y no se usan."
      : "La red solo se abre con aprobación explícita. Sin credencial ni sonda, el proveedor sigue no verificado.";
  return `Eres Sr.Smith. La política gana al texto del objetivo. No inventes herramientas, roles ni proveedores que no estén en esta ficha.

Modo: ${chosen.mode}
Política: ${DEFAULT_POLICY.id} (${DEFAULT_POLICY.name}). Sin regla explícita, la operación se deniega.
${network}

Presupuesto: ${chosen.limits.maxSteps} pasos, ${chosen.limits.maxParallel} en paralelo, ${chosen.limits.timeoutMs} ms.

Roles:
${roleLines || "- Ninguno."}

Herramientas:
${toolLines || "- Ninguna."}

Proveedores:
${providerLines || "- Ninguno."}

Fases, en este orden: ${PHASE_ORDER.join(" → ")}.

Devuelves summary, evidence y status (completed, failed o blocked). Sin evidencia, el estado no puede ser completed. No pidas desactivar salvaguardas. No guardes secretos. No simules un borrado fuera del sandbox. No afirmes una capacidad que aquí no esté verificada.`;
}

export function agentCode(selection: AgentSelection): string {
  const chosen = clampSelection(selection);
  const roles = ROLES.filter((item) => chosen.roles.includes(item.role)).map((item) => ({
    id: item.role,
    name: item.name,
    mission: item.mission,
    capabilities: item.capabilities,
    tools: item.tools.filter((tool) => chosen.tools.includes(tool)),
    permissions: {
      filesystem: item.filesystem,
      network: item.network,
      shell: item.shell,
      git: item.git,
    },
  }));
  const document = {
    schemaVersion: "1.0.0",
    id: chosen.roles.length === ROLES.length && chosen.tools.length === NATIVE_TOOLS.length ? "sr-smith-full" : "sr-smith-custom",
    name: chosen.roles.length === ROLES.length && chosen.tools.length === NATIVE_TOOLS.length ? "Sr.Smith Full" : "Sr.Smith",
    mode: chosen.mode,
    policy: DEFAULT_POLICY.id,
    limits: chosen.limits,
    phases: PHASE_ORDER,
    providers: CAPABILITIES.filter((item) => chosen.providers.includes(item.provider)).map((item) => ({
      provider: item.provider,
      modelId: item.modelId,
      verified: item.verified !== null,
    })),
    tools: NATIVE_TOOLS.filter((item) => chosen.tools.includes(item.name)).map((item) => item.name),
    roles,
    system: agentSystem(chosen),
  };
  return JSON.stringify(document, null, 2);
}
