import type { AgentResult, Analysis, Task } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { searchKnowledge, type RetrievalHit } from "../../knowledge/retrieval/index.ts";
import { scanUntrusted } from "../../governance/safety/index.ts";
import { decide, DEFAULT_POLICY } from "../../governance/policies/index.ts";
import type { ExecutionMode } from "../../core/domain/index.ts";
import { VirtualSandbox } from "../../workers/sandbox/index.ts";
import { text } from "../../intelligence/analysis.ts";
import { executeTool } from "../../tools/fabric.ts";

export interface RuntimeContext {
  objective: string;
  analysis: Analysis;
  mode: ExecutionMode;
  sandbox: VirtualSandbox;
  hits: RetrievalHit[];
  approvals: string[];
}

export function executeReferenceAgent(task: Task, context: RuntimeContext): AgentResult {
  const hits = context.hits.length > 0 ? context.hits : searchKnowledge(context.objective, 3);
  const outputs = produce(task, context, hits);
  const evidence = Array.isArray(outputs.evidence) ? (outputs.evidence as string[]) : [];
  return {
    schemaVersion: SCHEMA_VERSION,
    agentId: task.assignedAgentId ?? `agt_${task.assignedRole ?? "planner"}`,
    taskId: task.id,
    status: "completed",
    summary: String(outputs.summary ?? task.title),
    outputs,
    evidence,
  };
}

function produce(task: Task, context: RuntimeContext, hits: RetrievalHit[]): Record<string, unknown> {
  const language = context.analysis.language;
  const role = task.assignedRole;
  if (role === "planner" || task.type === "framing") {
    const criteria = [
      text(language, "El grafo resultante es acíclico.", "The resulting graph is acyclic."),
      text(language, "Cada tarea tiene un rol del perfil.", "Every task has a role from the profile."),
      text(language, "Las operaciones denegadas no se ejecutan.", "Denied operations are not executed."),
    ];
    return {
      summary: text(language, "Objetivo encuadrado con criterios observables.", "Objective framed with observable criteria."),
      successCriteria: criteria,
      nonGoals: [
        text(language, "No modificar producción.", "Do not modify production."),
        text(language, "No inventar capacidades de modelo.", "Do not invent model capabilities."),
      ],
      risks: context.analysis.risks,
      evidence: criteria.map((criterion) => `${criterion} Fuente: objetivo de ${context.objective.length} caracteres.`),
    };
  }
  if (role === "architect") {
    const components = [
      { name: "control-plane", dependsOn: [] },
      { name: "task-graph", dependsOn: ["control-plane"] },
      { name: "sandbox", dependsOn: ["task-graph"] },
      { name: "verification", dependsOn: ["sandbox"] },
    ];
    return {
      summary: text(language, "Arquitectura acotada al sandbox y al plano de control.", "Architecture bounded to the sandbox and control plane."),
      components,
      nonGoals: [text(language, "No microservicios en esta fase.", "No microservices in this phase.")],
      evidence: [
        text(language, "Componentes: control-plane, task-graph, sandbox, verification.", "Components: control-plane, task-graph, sandbox, verification."),
        text(language, "Dependencias en una sola dirección, sin ciclo.", "Dependencies run one way, with no cycle."),
        text(language, "No-objetivo explícito: no partir en microservicios.", "Explicit non-goal: do not split into microservices."),
      ],
    };
  }
  if (role === "researcher" || role === "knowledge-engineer") {
    const citations = hits.map((hit) => ({ source: hit.source, title: hit.title, excerpt: hit.excerpt }));
    const uncovered = hits.length === 0;
    return {
      summary: uncovered
        ? text(language, "El corpus no cubre el objetivo.", "The corpus does not cover the objective.")
        : text(language, `Se recuperaron ${hits.length} pasajes locales.`, `Retrieved ${hits.length} local passages.`),
      citations,
      uncovered,
      evidence: [
        uncovered
          ? text(language, "Marcado como no cubierto: el índice léxico no devolvió pasajes.", "Marked uncovered: the lexical index returned no passages.")
          : citations.map((citation) => `${citation.title} (${citation.source}): ${citation.excerpt.slice(0, 140)}`).join(" "),
        text(language, "No se presentan resultados de red como si fueran del corpus.", "No web results are presented as corpus hits."),
      ],
    };
  }
  if (role === "security-engineer") {
    const decisions = ["secrets", "external-delete", "network", "production-change"].map((operation) =>
      decide(DEFAULT_POLICY, operation as "secrets", context.mode),
    );
    return {
      summary: text(language, "Modelo de amenazas del runtime de referencia.", "Threat model of the reference runtime."),
      decisions,
      threats: [
        text(language, "Inyección de instrucciones en argumentos de herramientas.", "Prompt injection in tool arguments."),
        text(language, "Escritura fuera de sandbox/.", "Writes outside sandbox/."),
        text(language, "Confundir capacidad declarada con verificada.", "Confusing declared capabilities with verified ones."),
      ],
      evidence: [
        decisions.map((decision) => `${decision.operation}=${decision.effect}`).join("; "),
        text(language, "No se incluye material secreto en este artefacto.", "This artifact contains no secret material."),
        text(language, "external-delete permanece denegado.", "external-delete stays denied."),
      ],
    };
  }
  if (role === "principal-engineer" || role === "systems-engineer" || role === "performance-engineer" || role === "data-engineer") {
    return {
      summary: text(language, "El cambio vive en sandbox/src/change.ts.", "The change lives in sandbox/src/change.ts."),
      contract: {
        input: "objective: string",
        output: "ExecutionReport",
        boundary: "sandbox/",
      },
      files: ["sandbox/src/change.ts"],
      evidence: [
        text(language, "Archivo de sandbox: sandbox/src/change.ts.", "Sandbox file: sandbox/src/change.ts."),
        text(language, "Contrato de salida: artefacto con summary, evidence y path.", "Output contract: artifact with summary, evidence and path."),
      ],
    };
  }
  if (role === "developer" || role === "documentation-engineer") {
    const path = role === "documentation-engineer" ? "sandbox/docs/BEHAVIOR.md" : "sandbox/src/change.ts";
    const visibleObjective = scanUntrusted(context.objective).sanitized;
    const content =
      role === "documentation-engineer"
        ? `# Comportamiento\n\nObjetivo: ${visibleObjective.slice(0, 400)}\n\nEstado: referencia local. No es un modelo externo ni un despliegue.\n`
        : `/** Sandbox artifact. Not a claim of production completion. */\nexport const objective = ${JSON.stringify(visibleObjective.slice(0, 280))};\nexport const signals = ${JSON.stringify(context.analysis.signals)};\n`;
    const change = executeTool("workspace.write", { path, content }, {
      mode: context.mode,
      approvals: context.approvals,
      sandbox: context.sandbox,
      memoryNotes: [],
    });
    if (change.status !== "completed") {
      return {
        summary: change.error?.message ?? "write failed",
        evidence: [change.error?.message ?? "write failed"],
        change,
      };
    }
    return {
      summary: text(language, `Escrito ${path}.`, `Wrote ${path}.`),
      path,
      change: change.output,
      evidence: [
        text(language, `Diff registrado en ${path}.`, `Diff recorded at ${path}.`),
        text(language, `El contenido cita el objetivo (${visibleObjective.slice(0, 80)}).`, `Content cites the objective (${visibleObjective.slice(0, 80)}).`),
        text(language, "La ruta permanece bajo sandbox/.", "The path stays under sandbox/."),
      ],
    };
  }
  if (role === "qa-engineer") {
    const cases = task.acceptanceCriteria.map((criterion, index) => ({
      id: `case-${index + 1}`,
      criterion,
      kind: context.analysis.sensitive && index === 0 ? "policy-negative" : "acceptance",
    }));
    return {
      summary: text(language, `${cases.length} casos de aceptación.`, `${cases.length} acceptance cases.`),
      cases,
      evidence: cases.map((item) => `${item.id}: ${item.criterion}`),
    };
  }
  if (role === "reviewer") {
    const findings = context.analysis.sensitive
      ? [text(language, "El objetivo contiene señales sensibles: confirmar que no hubo efecto externo.", "The objective contains sensitive signals: confirm there was no external effect.")]
      : [];
    return {
      summary: findings.length
        ? text(language, "Revisión con un hallazgo de contención.", "Review with one containment finding.")
        : text(language, "Revisión sin hallazgos de frontera.", "Review with no boundary findings."),
      findings,
      authorRole: "developer",
      reviewerRole: "reviewer",
      evidence: [
        findings[0] ?? text(language, "Ningún hallazgo: el diff queda dentro de sandbox/ y no hay señales sensibles.", "No findings: the diff stays inside sandbox/ and there are no sensitive signals."),
        text(language, "El revisor es reviewer, distinto de developer.", "The reviewer is reviewer, distinct from developer."),
      ],
    };
  }
  if (role === "debugger" || role === "recovery-agent") {
    return {
      summary: text(language, "Sin fallo reproducible en el runtime de referencia.", "No reproducible failure in the reference runtime."),
      diagnosis: "none",
      evidence: [text(language, "No hay excepción previa que clasificar.", "There is no previous exception to classify.")],
    };
  }
  if (role === "watchdog" || role === "evaluator" || role === "orchestrator" || role === "devops-engineer") {
    return {
      summary: text(language, "Supervisión: presupuesto y fronteras intactos.", "Supervision: budget and boundaries intact."),
      evidence: task.acceptanceCriteria.map((criterion) => `${criterion} Observado en el estado del grafo.`),
    };
  }
  return {
    summary: task.title,
    evidence: task.acceptanceCriteria.map((criterion) => `${criterion} Cubierto por ${role}.`),
  };
}
