export interface BudgetState {
  maxSteps: number;
  steps: number;
  maxToolCalls: number;
  toolCalls: number;
  startedAt: number;
  timeoutMs: number;
}

export function createBudget(limits: {
  maxSteps: number;
  timeoutMs: number;
  maxToolCalls?: number;
}): BudgetState {
  return {
    maxSteps: limits.maxSteps,
    steps: 0,
    maxToolCalls: limits.maxToolCalls ?? limits.maxSteps * 2,
    toolCalls: 0,
    startedAt: Date.now(),
    timeoutMs: limits.timeoutMs,
  };
}

export function consumeStep(budget: BudgetState): { ok: true } | { ok: false; reason: string } {
  budget.steps += 1;
  if (budget.steps > budget.maxSteps) {
    return { ok: false, reason: `Límite de pasos agotado (${budget.maxSteps}).` };
  }
  if (Date.now() - budget.startedAt > budget.timeoutMs) {
    return { ok: false, reason: `Tiempo de ejecución agotado (${budget.timeoutMs} ms).` };
  }
  return { ok: true };
}

export function consumeTool(budget: BudgetState): { ok: true } | { ok: false; reason: string } {
  budget.toolCalls += 1;
  if (budget.toolCalls > budget.maxToolCalls) {
    return { ok: false, reason: `Límite de herramientas agotado (${budget.maxToolCalls}).` };
  }
  return { ok: true };
}
