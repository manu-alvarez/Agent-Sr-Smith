export class DshError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly details: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    options?: { retryable?: boolean; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "DshError";
    this.code = code;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details ?? {};
  }
}

export class PolicyDeniedError extends DshError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("policy_denied", message, { retryable: false, details });
    this.name = "PolicyDeniedError";
  }
}

export class BudgetExhaustedError extends DshError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("budget_exhausted", message, { retryable: false, details });
    this.name = "BudgetExhaustedError";
  }
}

export class ContractError extends DshError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("contract_invalid", message, { retryable: false, details });
    this.name = "ContractError";
  }
}

export class CycleError extends DshError {
  constructor(cycle: string[]) {
    super("task_cycle", `Task graph contains a cycle: ${cycle.join(" -> ")}`, {
      details: { cycle },
    });
    this.name = "CycleError";
  }
}

export function toErrorPayload(error: unknown): {
  code: string;
  message: string;
  retryable: boolean;
} {
  if (error instanceof DshError) {
    return { code: error.code, message: error.message, retryable: error.retryable };
  }
  if (error instanceof Error) {
    return { code: "internal_error", message: error.message, retryable: false };
  }
  return { code: "internal_error", message: String(error), retryable: false };
}
