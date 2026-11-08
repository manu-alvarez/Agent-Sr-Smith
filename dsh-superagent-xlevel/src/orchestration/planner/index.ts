import type { Analysis, OperationClass, Plan, ProfileId, RunInput, Task } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { createId, nowIso } from "../../core/identifiers/index.ts";
import { profileById } from "../../agents/profiles/index.ts";
import { text } from "../../intelligence/analysis.ts";

interface Stage {
  role: string;
  type: string;
  title: [string, string];
  description: [string, string];
  operation: OperationClass;
  criteria: (analysis: Analysis) => string[];
  when?: (analysis: Analysis, profile: ProfileId) => boolean;
  dependsOn: string[];
}

const STAGES: Stage[] = [
  {
    role: "planner",
    type: "framing",
    title: ["Encuadrar el objetivo", "Frame the objective"],
    description: [
      "Convertir el objetivo en criterios observables, supuestos y no-objetivos.",
      "Turn the objective into observable criteria, assumptions and non-goals.",
    ],
    operation: "analyze",
    criteria: (analysis) => [
      text(analysis.language, "Hay al menos tres criterios de éxito comprobables.", "At least three checkable success criteria exist."),
      text(analysis.language, "Los no-objetivos están escritos.", "Non-goals are explicit."),
      text(analysis.language, "Los riesgos sensibles quedan nombrados o se declara que no hay.", "Sensitive risks are named, or their absence is stated."),
    ],
    dependsOn: [],
  },
  {
    role: "architect",
    type: "architecture",
    title: ["Delimitar la arquitectura", "Bound the architecture"],
    description: [
      "Nombrar componentes, fronteras y dependencias del cambio.",
      "Name components, boundaries and dependencies of the change.",
    ],
    operation: "analyze",
    when: (analysis, profile) =>
      profile !== "research" && (analysis.signals.includes("software") || analysis.signals.includes("operations") || profile === "full" || profile === "engineering"),
    criteria: (analysis) => [
      text(analysis.language, "La nota nombra componentes acotados.", "The note names bounded components."),
      text(analysis.language, "Las dependencias entre componentes no forman un ciclo.", "Component dependencies are acyclic."),
      text(analysis.language, "Hay al menos un no-objetivo de arquitectura.", "There is at least one architectural non-goal."),
    ],
    dependsOn: ["framing"],
  },
  {
    role: "researcher",
    type: "research",
    title: ["Recuperar conocimiento", "Retrieve knowledge"],
    description: [
      "Buscar en el corpus local y citar solo pasajes recuperados.",
      "Search the local corpus and cite only retrieved passages.",
    ],
    operation: "analyze",
    when: (analysis, profile) =>
      analysis.signals.includes("research") || analysis.signals.includes("security") || profile === "research" || profile === "full",
    criteria: (analysis) => [
      text(analysis.language, "Cada afirmación cita un documento del corpus o se marca como no cubierta.", "Each claim cites a corpus document or is marked uncovered."),
      text(analysis.language, "No se presentan resultados web como si fueran del corpus.", "Web results are not presented as corpus hits."),
    ],
    dependsOn: ["framing"],
  },
  {
    role: "security-engineer",
    type: "threat-model",
    title: ["Modelar amenazas", "Model threats"],
    description: [
      "Revisar privilegios, inyección y operaciones denegadas.",
      "Review privileges, injection and denied operations.",
    ],
    operation: "analyze",
    when: (analysis, profile) =>
      analysis.sensitive || analysis.signals.includes("security") || profile === "security" || profile === "full",
    criteria: (analysis) => [
      text(analysis.language, "Cada operación sensible tiene una decisión de política.", "Each sensitive operation has a policy decision."),
      text(analysis.language, "Los secretos no aparecen en el artefacto.", "Secrets do not appear in the artifact."),
      text(analysis.language, "El borrado externo queda denegado, no simulado.", "External deletion is denied, not simulated."),
    ],
    dependsOn: ["framing"],
  },
  {
    role: "principal-engineer",
    type: "engineering-decision",
    title: ["Decidir la implementación", "Decide the implementation"],
    description: [
      "Elegir contratos internos y el orden de cambio dentro del sandbox.",
      "Choose internal contracts and the sandbox change order.",
    ],
    operation: "sandbox-read",
    when: (_analysis, profile) => profile === "engineering" || profile === "full" || profile === "autonomous",
    criteria: (analysis) => [
      text(analysis.language, "La decisión nombra archivos del sandbox, no de producción.", "The decision names sandbox files, not production."),
      text(analysis.language, "El contrato de salida está descrito.", "The output contract is described."),
    ],
    dependsOn: ["architecture", "threat-model", "research"],
  },
  {
    role: "developer",
    type: "sandbox-change",
    title: ["Escribir en el sandbox", "Write in the sandbox"],
    description: [
      "Materializar un artefacto verificable dentro del workspace virtual.",
      "Materialize a verifiable artifact inside the virtual workspace.",
    ],
    operation: "sandbox-write",
    when: (analysis, profile) =>
      profile === "engineering" ||
      profile === "autonomous" ||
      profile === "headless" ||
      profile === "full" ||
      analysis.signals.includes("software"),
    criteria: (analysis) => [
      text(analysis.language, "Existe un diff dentro de sandbox/.", "A diff exists inside sandbox/."),
      text(analysis.language, "El artefacto referencia el objetivo.", "The artifact references the objective."),
      text(analysis.language, "No se escribe fuera del prefijo sandbox/.", "Nothing is written outside the sandbox/ prefix."),
    ],
    dependsOn: ["engineering-decision", "architecture", "framing"],
  },
  {
    role: "qa-engineer",
    type: "test-plan",
    title: ["Diseñar pruebas", "Design tests"],
    description: [
      "Cubrir cada criterio de aceptación con un caso.",
      "Cover every acceptance criterion with a case.",
    ],
    operation: "test",
    when: (_analysis, profile) => profile !== "research",
    criteria: (analysis) => [
      text(analysis.language, "Hay un caso por criterio de aceptación del plan.", "There is a case per plan acceptance criterion."),
      text(analysis.language, "Los casos negativos de política están incluidos si el objetivo es sensible.", "Policy negative cases are included when the objective is sensitive."),
    ],
    dependsOn: ["sandbox-change", "threat-model", "research", "framing"],
  },
  {
    role: "reviewer",
    type: "review",
    title: ["Revisión independiente", "Independent review"],
    description: [
      "Cuestionar el entregable sin reutilizar la conclusión del autor.",
      "Challenge the deliverable without reusing the author's conclusion.",
    ],
    operation: "sandbox-read",
    when: (_analysis, profile) => profile === "engineering" || profile === "security" || profile === "full",
    criteria: (analysis) => [
      text(analysis.language, "La revisión lista hallazgos o declara ninguno con motivo.", "The review lists findings or states none with a reason."),
      text(analysis.language, "El revisor no es el rol que escribió el sandbox.", "The reviewer is not the role that wrote the sandbox."),
    ],
    dependsOn: ["sandbox-change", "test-plan", "threat-model"],
  },
  {
    role: "documentation-engineer",
    type: "docs",
    title: ["Documentar el comportamiento", "Document the behavior"],
    description: [
      "Describir lo implementado en el sandbox, no capacidades inexistentes.",
      "Describe what the sandbox implements, not nonexistent capabilities.",
    ],
    operation: "sandbox-write",
    when: (analysis, profile) => analysis.signals.includes("documentation") || profile === "full",
    criteria: (analysis) => [
      text(analysis.language, "La nota distingue implementado, referencia y contrato.", "The note distinguishes implemented, reference and contract."),
    ],
    dependsOn: ["review", "test-plan", "sandbox-change"],
  },
  {
    role: "evaluator",
    type: "acceptance",
    title: ["Verificar aceptación", "Verify acceptance"],
    description: [
      "Contrastar evidencia contra criterios. No heredar el estado declarado.",
      "Match evidence to criteria. Do not inherit self-reported status.",
    ],
    operation: "analyze",
    criteria: (analysis) => [
      text(analysis.language, "Cada criterio del plan tiene un chequeo con evidencia.", "Every plan criterion has a check with evidence."),
      text(analysis.language, "Un criterio sin evidencia no pasa.", "A criterion without evidence does not pass."),
    ],
    dependsOn: ["test-plan", "review", "research", "threat-model", "docs", "sandbox-change", "framing"],
  },
];

function stageActive(stage: Stage, analysis: Analysis, profile: ProfileId, roles: Set<string>): boolean {
  if (!roles.has(stage.role) && stage.role !== "planner" && stage.role !== "evaluator") return false;
  if (stage.role !== "planner" && stage.role !== "evaluator" && !roles.has(stage.role)) return false;
  return stage.when ? stage.when(analysis, profile) : true;
}

export function buildPlan(input: RunInput, analysis: Analysis): Plan {
  const profile = profileById(input.profileId ?? "engineering");
  const roles = new Set(profile.roles);
  const projectId = input.projectId ?? "prj_local";
  const active = STAGES.filter((stage) => stageActive(stage, analysis, profile.id, roles));
  const activeTypes = new Set(active.map((stage) => stage.type));
  const ids = new Map<string, string>();
  for (const stage of active) ids.set(stage.type, createId("tsk"));

  const tasks: Task[] = active.map((stage) => {
    const dependencies = stage.dependsOn.filter((type) => activeTypes.has(type)).map((type) => ids.get(type)!);
    return {
      schemaVersion: SCHEMA_VERSION,
      id: ids.get(stage.type)!,
      projectId,
      type: stage.type,
      title: text(analysis.language, stage.title[0], stage.title[1]),
      description: text(analysis.language, stage.description[0], stage.description[1]),
      assignedRole: stage.role,
      dependencies,
      status: "pending",
      acceptanceCriteria: stage.criteria(analysis),
      inputs: { objective: input.objective, signals: analysis.signals },
      budget: { maxSteps: 4, timeoutMs: 60_000, maxRetries: 1 },
      attempts: 0,
      requiresApproval: stage.operation === "git-write" || stage.operation === "production-change",
      operation: stage.operation,
    };
  });

  const successCriteria = [
    text(analysis.language, "El grafo no tiene ciclos.", "The graph has no cycles."),
    text(analysis.language, "Ninguna tarea denegada se marca como completada.", "No denied task is marked completed."),
    text(analysis.language, "La verificación independiente cubre los criterios del plan.", "Independent verification covers the plan criteria."),
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId("pln"),
    projectId,
    profileId: profile.id,
    objective: input.objective,
    summary: text(
      analysis.language,
      `Plan ${profile.name} para un objetivo ${analysis.complexity} con señales ${analysis.signals.join(", ")}.`,
      `${profile.name} plan for a ${analysis.complexity} objective with signals ${analysis.signals.join(", ")}.`,
    ),
    successCriteria,
    assumptions: [
      text(
        analysis.language,
        "El proveedor por defecto es el runtime de referencia determinista, no un modelo externo.",
        "The default provider is the deterministic reference runtime, not an external model.",
      ),
      text(
        analysis.language,
        "El sistema de archivos real no se modifica; el sandbox es virtual.",
        "The real filesystem is not modified; the sandbox is virtual.",
      ),
    ],
    nonGoals: [
      text(analysis.language, "No se desbloquean capacidades ocultas del modelo.", "Hidden model capabilities are not unlocked."),
      text(analysis.language, "No se publica, despliega ni borra fuera del sandbox.", "Nothing is published, deployed or deleted outside the sandbox."),
    ],
    risks: analysis.risks.length > 0 ? analysis.risks : [text(analysis.language, "Sin señales sensibles en el objetivo.", "No sensitive signals in the objective.")],
    tasks,
    createdAt: nowIso(),
  };
}
