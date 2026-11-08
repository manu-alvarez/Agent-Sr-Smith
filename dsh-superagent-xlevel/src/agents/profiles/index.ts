import type { ProfileId } from "../../core/domain/index.ts";

export interface ProfileDefinition {
  id: ProfileId;
  name: string;
  summary: string;
  roles: string[];
  tools: string[];
  capabilities: string[];
  limits: { maxSteps: number; maxParallel: number; timeoutMs: number };
}

export const PROFILES: ProfileDefinition[] = [
  {
    id: "research",
    name: "Research X",
    summary: "Investigación, síntesis y validación de fuentes.",
    roles: ["planner", "researcher", "knowledge-engineer", "evaluator", "watchdog"],
    tools: ["knowledge.search", "memory.recall", "memory.remember"],
    capabilities: ["research", "citation", "synthesis"],
    limits: { maxSteps: 24, maxParallel: 3, timeoutMs: 180_000 },
  },
  {
    id: "engineering",
    name: "Engineering X",
    summary: "Diseño, implementación en sandbox, pruebas y revisión independiente.",
    roles: [
      "planner",
      "architect",
      "principal-engineer",
      "developer",
      "qa-engineer",
      "reviewer",
      "evaluator",
      "watchdog",
    ],
    tools: ["workspace.read", "workspace.write", "knowledge.search"],
    capabilities: ["design", "implementation", "verification"],
    limits: { maxSteps: 36, maxParallel: 4, timeoutMs: 240_000 },
  },
  {
    id: "autonomous",
    name: "Autonomous X",
    summary: "Ejecución prolongada con checkpoints, watchdog y recuperación.",
    roles: [
      "orchestrator",
      "planner",
      "developer",
      "qa-engineer",
      "watchdog",
      "recovery-agent",
      "evaluator",
    ],
    tools: ["workspace.read", "workspace.write", "memory.remember"],
    capabilities: ["checkpoint", "recovery", "long-running"],
    limits: { maxSteps: 48, maxParallel: 4, timeoutMs: 300_000 },
  },
  {
    id: "security",
    name: "Security X",
    summary: "Auditoría defensiva, modelo de amenazas y revisión de privilegios.",
    roles: ["planner", "security-engineer", "systems-engineer", "reviewer", "evaluator", "watchdog"],
    tools: ["policy.explain", "workspace.read", "knowledge.search"],
    capabilities: ["threat-model", "least-privilege"],
    limits: { maxSteps: 28, maxParallel: 3, timeoutMs: 180_000 },
  },
  {
    id: "full",
    name: "Sr.Smith Full",
    summary: "Todos los roles disponibles, con asignación según el objetivo.",
    roles: [
      "orchestrator",
      "planner",
      "architect",
      "researcher",
      "principal-engineer",
      "developer",
      "systems-engineer",
      "security-engineer",
      "debugger",
      "qa-engineer",
      "reviewer",
      "performance-engineer",
      "devops-engineer",
      "data-engineer",
      "knowledge-engineer",
      "documentation-engineer",
      "evaluator",
      "watchdog",
      "recovery-agent",
    ],
    tools: ["workspace.read", "workspace.write", "knowledge.search", "memory.recall", "policy.explain"],
    capabilities: ["planning", "implementation", "research", "security", "recovery"],
    limits: { maxSteps: 64, maxParallel: 4, timeoutMs: 360_000 },
  },
  {
    id: "headless",
    name: "Headless X",
    summary: "El mismo ciclo, pensado para CLI sin interfaz.",
    roles: ["planner", "developer", "qa-engineer", "evaluator", "watchdog"],
    tools: ["workspace.read", "workspace.write"],
    capabilities: ["cli", "verification"],
    limits: { maxSteps: 24, maxParallel: 2, timeoutMs: 180_000 },
  },
];

export function profileById(id: ProfileId): ProfileDefinition {
  const found = PROFILES.find((profile) => profile.id === id);
  if (!found) throw new Error(`Unknown profile ${id}`);
  return found;
}
