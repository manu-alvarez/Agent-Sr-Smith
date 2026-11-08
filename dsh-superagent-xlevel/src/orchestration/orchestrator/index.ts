import type { ExecutionReport, Phase, RunInput, Task, TimelineEntry } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { createEvent, createEventBus } from "../../core/events/index.ts";
import { createId, nowIso } from "../../core/identifiers/index.ts";
import { assertTransition } from "../../core/lifecycle/index.ts";
import { profileById } from "../../agents/profiles/index.ts";
import { executeReferenceAgent } from "../../agents/runtime/index.ts";
import { audit } from "../../governance/audit/index.ts";
import { authorize } from "../../governance/authorization/index.ts";
import { requestApproval, resolveApproval } from "../../governance/approvals/index.ts";
import { consumeStep, createBudget } from "../../governance/budgets/index.ts";
import { scanUntrusted } from "../../governance/safety/index.ts";
import { analyzeObjective } from "../../intelligence/analysis.ts";
import { selectStrategy } from "../../intelligence/reasoning/index.ts";
import { searchKnowledge } from "../../knowledge/retrieval/index.ts";
import { MemoryEngine } from "../../memory/store.ts";
import { MODULES } from "../../meta/modules.ts";
import { delegate } from "../delegation/index.ts";
import { buildPlan } from "../planner/index.ts";
import { routeTask } from "../router/index.ts";
import { batchReady } from "../scheduler/index.ts";
import { TaskGraph, verifyCheckpoint } from "../task-graph/index.ts";
import { diagnose } from "../../recovery/diagnostics/index.ts";
import { verifyTasks } from "../../verification/acceptance/index.ts";
import { VirtualSandbox } from "../../workers/sandbox/index.ts";
import type { ApprovalRequest, AuditRecord } from "../../core/domain/index.ts";

export function runObjective(input: RunInput): ExecutionReport {
  const executionId = createId("exe");
  const mode = input.mode ?? "strict-local";
  const profileId = input.profileId ?? "engineering";
  const profile = profileById(profileId);
  const approvals = input.approvals ?? [];
  const bus = createEventBus();
  const timeline: TimelineEntry[] = [];
  const auditLog: AuditRecord[] = [];
  const approvalLog: ApprovalRequest[] = [];
  const memory = new MemoryEngine();
  const sandbox = new VirtualSandbox();
  const budget = createBudget({ maxSteps: profile.limits.maxSteps, timeoutMs: profile.limits.timeoutMs, maxToolCalls: 32 });
  let phase: Phase = "received";
  let referenceCalls = 0;

  const move = (next: Phase, title: string, detail: string, level: TimelineEntry["level"] = "info", taskId?: string) => {
    if (phase !== next) assertTransition(phase, next);
    phase = next;
    timeline.push({ id: createId("evt"), at: nowIso(), phase, title, detail, taskId, level });
    bus.publish(createEvent({
      eventType: `execution.${next}`,
      aggregateId: executionId,
      correlationId: executionId,
      payload: { title, detail, taskId },
      producer: "orchestrator",
    }));
  };

  const objective = input.objective.trim();
  if (!objective) {
    move("analysis", "Objetivo vacío", "No hay nada que planificar.", "error");
    move("failed", "Ejecución rechazada", "El objetivo es obligatorio.", "error");
    return emptyReport({ executionId, mode, profileId, objective, phase, timeline, audit: auditLog, sandbox, memory, bus, limitations: ["Objetivo vacío."] });
  }

  move("analysis", "Análisis", "Clasificación determinista del objetivo.");
  const analysis = analyzeObjective(objective);
  const strategy = selectStrategy(analysis);
  const injection = scanUntrusted(objective);
  if (injection.flagged) {
    timeline.push({
      id: createId("evt"),
      at: nowIso(),
      phase,
      title: "Instrucciones no confiables",
      detail: `El objetivo contiene patrones que no tienen autoridad: ${injection.reasons.join(", ")}.`,
      level: "warn",
    });
  }
  const hits = searchKnowledge(objective, 3);
  const safeObjective = scanUntrusted(objective).sanitized;
  memory.remember({
    type: "episodic",
    content: safeObjective.slice(0, 500),
    projectId: input.projectId ?? "prj_local",
    source: "objective",
    confidence: 1,
  });
  memory.remember({
    type: "working",
    content: strategy.steps.join(" "),
    projectId: input.projectId ?? "prj_local",
    source: "reasoning",
  });

  move("planning", "Plan", strategy.steps.join(" "));
  const plan = buildPlan({ ...input, objective, profileId, mode }, analysis);
  auditLog.push(audit({ executionId, actor: "planner", action: "plan.created", outcome: "completed", details: { tasks: plan.tasks.length } }));

  move("policy_validation", "Políticas", "Cada operación del plan pasa por el motor de políticas.");
  for (const task of plan.tasks) {
    const decision = authorize({ operation: task.operation, mode, approvals });
    auditLog.push(audit({
      executionId,
      actor: "governance",
      action: `policy.${task.operation}`,
      outcome: decision.approved ? "allowed" : decision.effect === "require-approval" ? "escalated" : "denied",
      details: { taskId: task.id, ruleId: decision.ruleId },
    }));
  }

  move("task_graph", "Grafo", `${plan.tasks.length} tareas.`);
  const graph = new TaskGraph(plan.tasks);
  const checkpoints = [graph.checkpoint(executionId, 0, phase)];
  if (!verifyCheckpoint(checkpoints[0]!)) {
    move("failed", "Checkpoint inválido", "El checksum inicial no coincide.", "error");
  }

  move("scheduling", "Agenda", `Paralelismo máximo ${profile.limits.maxParallel}.`);
  move("delegation", "Delegación", "Cada tarea lista se asigna a un rol del perfil.");
  move("execution", "Ejecución", "Runtime de referencia dentro del sandbox virtual.");

  const seenReady = new Map<string, number>();
  let guard = 0;
  while (graph.open().length > 0 && guard < profile.limits.maxSteps) {
    guard += 1;
    const step = consumeStep(budget);
    if (!step.ok) {
      timeline.push({ id: createId("evt"), at: nowIso(), phase, title: "Presupuesto agotado", detail: step.reason, level: "error" });
      break;
    }
    const ready = graph.ready();
    if (ready.length === 0) break;
    const signature = ready.map((task) => task.id).sort().join(",");
    seenReady.set(signature, (seenReady.get(signature) ?? 0) + 1);
    if ((seenReady.get(signature) ?? 0) > 2) {
      timeline.push({ id: createId("evt"), at: nowIso(), phase, title: "Bucle de agenda", detail: "El mismo conjunto listo se repitió.", level: "error" });
      break;
    }
    const batch = batchReady(ready, profile.limits.maxParallel)[0];
    for (const taskId of batch?.taskIds ?? []) {
      const current = graph.get(taskId);
      const route = routeTask(current, profile);
      if (!route.accepted) {
        graph.transition(taskId, "failed", { blockedReason: route.reason, attempts: current.attempts + 1 });
        continue;
      }
      const assigned = delegate(current);
      graph.transition(taskId, "ready", { assignedAgentId: assigned.agent.id, assignedRole: assigned.agent.role });
      const auth = authorize({ operation: current.operation, mode, approvals, approvalId: current.requiresApproval ? `apr_${taskId}` : undefined });
      if (!auth.approved) {
        const pending = requestApproval({
          executionId,
          taskId,
          operation: current.operation,
          reason: auth.reason,
        });
        const resolved = resolveApproval(pending, approvals);
        approvalLog.push(resolved);
        graph.transition(taskId, "blocked", { blockedReason: auth.reason, requiresApproval: true });
        timeline.push({ id: createId("evt"), at: nowIso(), phase, title: current.title, detail: auth.reason, taskId, level: "warn" });
        continue;
      }
      graph.transition(taskId, "running");
      referenceCalls += 1;
      const result = executeReferenceAgent(graph.get(taskId), {
        objective,
        analysis,
        mode,
        sandbox,
        hits,
        approvals,
      });
      const enough = result.evidence.length > 0 && result.evidence.every((item) => item.trim().length > 8);
      if (!enough && current.attempts < current.budget.maxRetries) {
        graph.transition(taskId, "failed", { attempts: current.attempts + 1, blockedReason: "Evidencia insuficiente.", outputs: result.outputs });
        timeline.push({ id: createId("evt"), at: nowIso(), phase, title: current.title, detail: "Reintento: evidencia insuficiente.", taskId, level: "warn" });
        continue;
      }
      if (!enough) {
        graph.transition(taskId, "failed", { attempts: current.attempts + 1, blockedReason: "Evidencia insuficiente.", outputs: result.outputs });
        continue;
      }
      graph.transition(taskId, "completed", { outputs: result.outputs, attempts: current.attempts + 1 });
      memory.remember({
        type: "episodic",
        content: `${current.title}: ${result.summary}`,
        projectId: plan.projectId,
        agentId: result.agentId,
        source: current.assignedRole ?? "agent",
        confidence: 0.8,
      });
      timeline.push({ id: createId("evt"), at: nowIso(), phase, title: current.title, detail: result.summary, taskId, level: "ok" });
      auditLog.push(audit({ executionId, actor: result.agentId, action: `task.${current.type}`, outcome: "completed", details: { taskId } }));
    }
    checkpoints.push(graph.checkpoint(executionId, checkpoints.length, phase));
  }

  for (const task of graph.list()) {
    if (task.status === "pending" || task.status === "ready" || task.status === "running") {
      graph.transition(task.status === "running" ? task.id : task.id, task.status === "pending" ? "blocked" : "blocked", {
        blockedReason: "No llegó a completarse dentro del presupuesto.",
      });
    }
  }

  const tasks = graph.list();
  const recovery = diagnose(executionId, tasks, Math.max(0, profile.limits.maxSteps - budget.steps));
  if (tasks.some((task) => task.status === "failed" || task.status === "blocked")) {
    move("recovery", "Recuperación", recovery.diagnosis, "warn");
  }
  move("verification", "Verificación", "El evaluador no hereda el estado declarado por cada worker.");
  const verification = verifyTasks(executionId, tasks, plan.successCriteria);
  const limitations = [
    "El proveedor activo es dsh-reference-1: determinista, no es un modelo neuronal.",
    "El sandbox es virtual. No se ha tocado el sistema de archivos real ni un repositorio git.",
    "Los adaptadores de red existen como código, pero strict-local no los llama.",
    "La recuperación léxica no es un índice vectorial.",
  ];
  if (analysis.sensitive) {
    limitations.push("Las señales sensibles se contienen: no hay borrado externo, secretos ni cambios de producción.");
  }
  if (injection.flagged) {
    limitations.push("El texto del objetivo no puede desactivar políticas ni revelar un prompt oculto.");
  }

  let status: ExecutionReport["status"] = "completed";
  if (tasks.some((task) => task.status === "failed") || !verification.accepted) {
    status = tasks.some((task) => task.status === "blocked") && !tasks.some((task) => task.status === "failed") ? "blocked" : "failed";
    if (tasks.some((task) => task.status === "blocked") && !verification.accepted && !tasks.some((task) => task.status === "failed")) {
      status = "blocked";
    }
    if (!verification.accepted && tasks.every((task) => task.status === "completed")) status = "failed";
  }
  if (tasks.some((task) => task.status === "blocked") && !tasks.some((task) => task.status === "failed") && verification.accepted) {
    status = "completed";
  }
  if (tasks.some((task) => task.status === "blocked") && !verification.accepted) status = "blocked";
  if (tasks.some((task) => task.status === "failed")) status = "failed";

  const finalPhase: Phase = status === "completed" ? "completed" : status === "blocked" ? "blocked" : "failed";
  move(finalPhase, status === "completed" ? "Completado" : status === "blocked" ? "Bloqueado" : "Fallido", verification.summary, status === "completed" ? "ok" : "warn");

  memory.consolidate(plan.projectId);

  return {
    schemaVersion: SCHEMA_VERSION,
    executionId,
    status,
    phase,
    mode,
    profileId,
    objective,
    analysis,
    plan,
    tasks,
    timeline,
    checkpoints,
    verification,
    recovery: status === "completed" ? undefined : recovery,
    approvals: approvalLog,
    audit: auditLog,
    memory: memory.all(),
    knowledgeHits: hits,
    workspace: sandbox.list(),
    changes: sandbox
      .list()
      .filter((file) => file.path.startsWith("sandbox/") && file.path !== "sandbox/.gitkeep" && file.content.length > 0)
      .map((file) => ({ path: file.path, op: "write" as const, after: file.content })),
    events: bus.history(),
    watchdog: {
      blockedTasks: tasks.filter((task) => task.status === "blocked").map((task) => task.id),
      loops: [...seenReady.entries()].filter(([, count]) => count > 2).map(([signature]) => signature),
      budgetExhausted: budget.steps > profile.limits.maxSteps,
      deviations: injection.flagged ? injection.reasons : [],
    },
    usage: { steps: budget.steps, toolCalls: budget.toolCalls, referenceCalls },
    limitations,
    moduleStatus: MODULES,
  };
}

function emptyReport(input: {
  executionId: string;
  mode: ExecutionReport["mode"];
  profileId: ExecutionReport["profileId"];
  objective: string;
  phase: Phase;
  timeline: TimelineEntry[];
  audit: AuditRecord[];
  sandbox: VirtualSandbox;
  memory: MemoryEngine;
  bus: ReturnType<typeof createEventBus>;
  limitations: string[];
}): ExecutionReport {
  const analysis = analyzeObjective(input.objective || " ");
  const plan = buildPlan(
    { objective: input.objective || "(vacío)", profileId: input.profileId, mode: input.mode },
    analysis,
  );
  const tasks: Task[] = [];
  return {
    schemaVersion: SCHEMA_VERSION,
    executionId: input.executionId,
    status: "failed",
    phase: input.phase,
    mode: input.mode,
    profileId: input.profileId,
    objective: input.objective,
    analysis,
    plan: { ...plan, tasks },
    tasks,
    timeline: input.timeline,
    checkpoints: [],
    verification: {
      schemaVersion: SCHEMA_VERSION,
      id: createId("ver"),
      executionId: input.executionId,
      accepted: false,
      checks: [],
      reviewer: "agt_evaluator",
      summary: "Sin ejecución.",
      createdAt: nowIso(),
    },
    approvals: [],
    audit: input.audit,
    memory: input.memory.all(),
    knowledgeHits: [],
    workspace: input.sandbox.list(),
    changes: [],
    events: input.bus.history(),
    watchdog: { blockedTasks: [], loops: [], budgetExhausted: false, deviations: [] },
    usage: { steps: 0, toolCalls: 0, referenceCalls: 0 },
    limitations: input.limitations,
    moduleStatus: MODULES,
  };
}
