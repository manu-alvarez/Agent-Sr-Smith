import type { ExecutionMode, OperationClass, PolicyDecision } from "../../core/domain/index.ts";
import { decide, DEFAULT_POLICY } from "../policies/index.ts";

export interface AuthorizationResult extends PolicyDecision {
  approved: boolean;
}

export function authorize(input: {
  operation: OperationClass;
  mode: ExecutionMode;
  approvals: string[];
  approvalId?: string;
}): AuthorizationResult {
  const decision = decide(DEFAULT_POLICY, input.operation, input.mode);
  if (decision.effect === "allow") return { ...decision, approved: true };
  if (decision.effect === "require-approval") {
    const approved = Boolean(input.approvalId && input.approvals.includes(input.approvalId));
    return { ...decision, approved };
  }
  return { ...decision, approved: false };
}
