export interface TokenBudget {
  maxTokens: number;
  used: number;
}

export function spend(budget: TokenBudget, tokens: number): { ok: boolean; reason?: string } {
  budget.used += tokens;
  if (budget.used > budget.maxTokens) return { ok: false, reason: "Presupuesto de tokens agotado." };
  return { ok: true };
}
