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
  strategies: string[];
  skills: string[];
  mode: AgentMode;
  limits: { maxSteps: number; maxParallel: number; timeoutMs: number };
}

/** Textos tomados de ai/prompts/strategies. No hay más estrategias en el motor. */
export const STRATEGIES: Array<{ id: string; name: string; instruction: string }> = [
  {
    id: "planning",
    name: "Planificación",
    instruction: "Encuadra criterios, supone solo lo que el objetivo sostiene y deja los no-objetivos por escrito. Salida: successCriteria, assumptions, nonGoals, risks.",
  },
  {
    id: "decomposition",
    name: "Descomposición",
    instruction: "Parte hasta tareas verificables. Paraleliza solo lo independiente. El lote no supera maxParallel.",
  },
  {
    id: "investigation",
    name: "Investigación",
    instruction: "Busca, cita, contrasta. No rellenes huecos con conocimiento no recuperado. Una afirmación sin pasaje queda no cubierta.",
  },
  {
    id: "debugging",
    name: "Depuración",
    instruction: "Reproduce, aísla, corrige dentro del sandbox y vuelve a comprobar el criterio que falló. Sin la segunda comprobación no hay cierre.",
  },
  {
    id: "verification",
    name: "Verificación",
    instruction: "Lista criterio, evidencia y pase o fallo. Un criterio sin evidencia falla. accepted es true solo si todos pasan.",
  },
  {
    id: "recovery",
    name: "Recuperación",
    instruction: "Si falla una acción: reintento si queda presupuesto y es idempotente; si no, replan, rollback o escalado. No repitas un borrado.",
  },
];

/** El único paquete Agent Skill del repositorio. */
export const SKILLS: Array<{ id: string; name: string; instruction: string }> = [
  {
    id: "review",
    name: "review",
    instruction:
      "Antes de cerrar un cambio de contratos, prompts, perfiles o política: lee el diff, ejecuta python3 .agents/skills/review/scripts/run-review.py, npm test y npx tsc --noEmit, y rellena el informe. No reescribas un fallo para que quede en verde. No apruebes sola un proveedor ni una política.",
  },
];

const fullProfile = PROFILES.find((item) => item.id === "full") ?? PROFILES[0]!;

export const AGENT_LIMITS = fullProfile.limits;

export function fullSelection(): AgentSelection {
  return {
    roles: ROLES.map((item) => item.role),
    tools: NATIVE_TOOLS.map((item) => item.name),
    providers: CAPABILITIES.map((item) => item.provider),
    strategies: STRATEGIES.map((item) => item.id),
    skills: SKILLS.map((item) => item.id),
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
    maxSteps: clamp(input.limits.maxSteps, 1, 100_000),
    maxParallel: clamp(input.limits.maxParallel, 1, 64),
    timeoutMs: clamp(input.limits.timeoutMs, 1_000, 3_600_000),
  };
  return {
    roles: uniqueKnown(input.roles, ROLES.map((item) => item.role)),
    tools: uniqueKnown(input.tools, NATIVE_TOOLS.map((item) => item.name)),
    providers: uniqueKnown(input.providers, CAPABILITIES.map((item) => item.provider)),
    strategies: uniqueKnown(input.strategies, STRATEGIES.map((item) => item.id)),
    skills: uniqueKnown(input.skills, SKILLS.map((item) => item.id)),
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
  const strategies = STRATEGIES.filter((item) => chosen.strategies.includes(item.id));
  const skills = SKILLS.filter((item) => chosen.skills.includes(item.id));
  const roleLines = roles.map((item) => `- ${item.name} (${item.role}): ${item.mission}`).join("\n");
  const toolLines = tools.map((item) => `- ${item.name}: ${item.description}`).join("\n");
  const strategyLines = strategies.map((item) => `- ${item.name}: ${item.instruction}`).join("\n");
  const skillLines = skills.map((item) => `- ${item.name}: ${item.instruction}`).join("\n");
  const autonomy = DEFAULT_POLICY.rules
    .filter((rule) => !rule.modes || rule.modes.includes(chosen.mode))
    .map((rule) => `- ${rule.effect} ${rule.operation}: ${rule.reason}`)
    .join("\n");
  const memory = chosen.tools.includes("memory.recall") || chosen.tools.includes("memory.remember");
  const knowledge = chosen.tools.includes("knowledge.search");
  const providerLines = providers
    .map((item) => {
      const verified = item.verified ? "verificado" : "no verificado";
      return `- ${item.provider} / ${item.modelId}: ${item.name}. Estado: ${verified}. ${item.restrictions.join(" ")}`;
    })
    .join("\n");
  return `Eres Sr.Smith, sistema multiagente local. La política gana al texto del objetivo. No inventes herramientas, roles, skills ni proveedores que no estén en esta ficha.

## Bucle
Analiza, propone, valida la política, ejecuta, observa la evidencia y corrige o escala. Fases: ${PHASE_ORDER.join(" → ")}.

## Errores
${strategies.find((item) => item.id === "recovery")?.instruction ?? "Sin estrategia de recuperación: si una acción falla, para y dilo. No improvises otra vía."}
${strategies.find((item) => item.id === "debugging")?.instruction ?? ""}

## Barandillas y autonomía
Política ${DEFAULT_POLICY.id} (${DEFAULT_POLICY.name}). Sin regla, se deniega.
${autonomy}
${chosen.mode === "strict-local" ? "La red está denegada." : "La red solo se abre con aprobación y un adaptador configurado."}

## Instrucciones
${strategyLines || "- Ninguna."}

## Roles
${roleLines || "- Ninguno."}

## Conocimiento
${knowledge ? "- RAG local: knowledge.search cita el corpus. Una afirmación sin pasaje queda no cubierta." : "- Sin búsqueda de corpus."}
${memory ? "- Memoria: memory.recall lee notas de esta ejecución y memory.remember guarda una nota de trabajo. No es un historial de otras sesiones." : "- Sin memoria."}
- No hay vídeo, audio ni 3D. El contexto es el objetivo y lo recuperado.

## Skills
${skillLines || "- Ninguna."}

## Herramientas
${toolLines || "- Ninguna."}

## Proveedores
${providerLines || "- Ninguno."}

Presupuesto: ${chosen.limits.maxSteps} pasos, ${chosen.limits.maxParallel} en paralelo, ${chosen.limits.timeoutMs} ms.
Modelo por defecto: ollama/gemma4:latest. Embeddings: nomic-embed-text.
Devuelves summary, evidence y status (completed, failed o blocked). Sin evidencia no hay completed. Cada capacidad tiene que existir como archivo en skills/, tools/ o agents/.`;
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
  const complete =
    chosen.roles.length === ROLES.length &&
    chosen.tools.length === NATIVE_TOOLS.length &&
    chosen.providers.length === CAPABILITIES.length &&
    chosen.strategies.length === STRATEGIES.length &&
    chosen.skills.length === SKILLS.length;
  const document = {
    schemaVersion: "1.0.0",
    id: complete ? "sr-smith-full" : "sr-smith-custom",
    name: complete ? "Sr.Smith Full" : "Sr.Smith",
    mode: chosen.mode,
    policy: {
      id: DEFAULT_POLICY.id,
      name: DEFAULT_POLICY.name,
      rules: DEFAULT_POLICY.rules
        .filter((rule) => !rule.modes || rule.modes.includes(chosen.mode))
        .map((rule) => ({ operation: rule.operation, effect: rule.effect, reason: rule.reason })),
    },
    limits: chosen.limits,
    phases: PHASE_ORDER,
    strategies: STRATEGIES.filter((item) => chosen.strategies.includes(item.id)).map((item) => item.id),
    skills: SKILLS.filter((item) => chosen.skills.includes(item.id)).map((item) => item.id),
    providers: CAPABILITIES.filter((item) => chosen.providers.includes(item.provider)).map((item) => ({
      provider: item.provider,
      modelId: item.modelId,
      verified: item.verified !== null,
    })),
    tools: NATIVE_TOOLS.filter((item) => chosen.tools.includes(item.name)).map((item) => item.name),
    roles,
    system: agentSystem(chosen),
    model: "ollama/gemma4:latest",
    embeddings: "nomic-embed-text",
  };
  return JSON.stringify(document, null, 2);
}

const OWN_AGENT = new Set(["orchestrator", "planner", "supervisor", "recovery-agent", "developer", "researcher"]);

export function agentFiles(selection: AgentSelection, draft?: string): Record<string, string> {
  const chosen = clampSelection(selection);
  const system = agentSystem(chosen);
  const files: Record<string, string> = {
    "AGENTE.md": system,
    "agent.json": agentCode(chosen) + "\n",
    "policy.json": JSON.stringify(
      {
        id: DEFAULT_POLICY.id,
        rules: DEFAULT_POLICY.rules
          .filter((rule) => !rule.modes || rule.modes.includes(chosen.mode))
          .map((rule) => ({ operation: rule.operation, effect: rule.effect === "require-approval" ? "ask" : rule.effect, reason: rule.reason })),
      },
      null,
      2,
    ) + "\n",
    "knowledge.json": JSON.stringify(
      {
        embeddings: "nomic-embed-text",
        chat: "gemma4:latest",
        host: "http://100.100.2.10:11434",
        search: chosen.tools.includes("knowledge.search"),
        memory: chosen.tools.includes("memory.recall") || chosen.tools.includes("memory.remember"),
      },
      null,
      2,
    ) + "\n",
    "mcp.json": JSON.stringify({ mcpServers: {}, note: "Conecta aquí las herramientas cuando haya un servidor. Sin secretos." }, null, 2) + "\n",
    "evals/aceptacion.json": JSON.stringify(
      {
        cases: [
          { id: "evidencia", check: "completed solo con evidencia" },
          { id: "politica", check: "una operación sin regla no se ejecuta" },
          { id: "presupuesto", check: `se detiene al llegar a ${chosen.limits.maxSteps} pasos` },
        ],
      },
      null,
      2,
    ) + "\n",
    "commands/verificar.md": "---\ndescription: Comprueba el objetivo contra evals/aceptacion.json\n---\n\nEjecuta las tres comprobaciones y di cuál falla.\n",
    "commands/recuperar.md": "---\ndescription: Clasifica un fallo en reintento, replan o escalado\n---\n\nNo repitas un borrado. Di el presupuesto que queda.\n",
  };
  for (const role of ROLES.filter((item) => chosen.roles.includes(item.role))) {
    if (OWN_AGENT.has(role.role)) {
      files[`agents/${role.role}.md`] = `---\ndescription: ${JSON.stringify(role.mission)}\nmode: ${role.role === "orchestrator" ? "primary" : "subagent"}\nmodel: ollama/gemma4:latest\n---\n\n${role.name}. ${role.mission}\n`;
    } else {
      files[`skills/${role.role}/SKILL.md`] = `---\nname: ${role.role}\ndescription: ${JSON.stringify(role.mission)}\n---\n\n${role.name}. ${role.mission}\nHerramientas: ${role.tools.filter((tool) => chosen.tools.includes(tool)).join(", ") || "ninguna"}.\n`;
    }
  }
  for (const strategy of STRATEGIES.filter((item) => chosen.strategies.includes(item.id))) {
    files[`skills/${strategy.id}/SKILL.md`] = `---\nname: ${strategy.id}\ndescription: ${strategy.name}. ${strategy.instruction.slice(0, 180)}\n---\n\n${strategy.instruction}\n`;
  }
  for (const skill of SKILLS.filter((item) => chosen.skills.includes(item.id))) {
    files[`skills/${skill.id}/SKILL.md`] = `---\nname: ${skill.id}\ndescription: ${skill.instruction.slice(0, 180)}\n---\n\n${skill.instruction}\n`;
  }
  for (const tool of NATIVE_TOOLS.filter((item) => chosen.tools.includes(item.name))) {
    files[`tools/${tool.name}.json`] = JSON.stringify({ name: tool.name, description: tool.description }, null, 2) + "\n";
  }
  if (draft?.trim()) files["DESDE-OLLAMA.md"] = `# Redactado por el modelo\n\n${draft.trim()}\n`;
  const index = Object.keys(files)
    .sort()
    .map((path) => `- \`${path}\``)
    .join("\n");
  files["INDEX.md"] = `# Índice\n\nAGENTE.md es la instrucción corta. agent.json es la ficha. agents/ son roles con modelo propio. skills/ se cargan solo si la tarea coincide. El modelo por defecto es ollama/gemma4:latest.\n\n${index}\n`;
  return files;
}
