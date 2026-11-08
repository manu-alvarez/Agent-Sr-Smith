import type { RecoveryPlan } from "../../core/domain/index.ts";

export function replanAllowed(plan: RecoveryPlan): boolean {
  return plan.budgetRemaining > 0 && plan.actions.some((action) => action.kind === "replan" || action.kind === "retry");
}
