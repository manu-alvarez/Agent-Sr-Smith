import type { ApprovalRequest, OperationClass } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { createId, nowIso } from "../../core/identifiers/index.ts";

export function requestApproval(input: {
  executionId: string;
  taskId?: string;
  operation: OperationClass;
  reason: string;
}): ApprovalRequest {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId("apr"),
    executionId: input.executionId,
    taskId: input.taskId,
    operation: input.operation,
    reason: input.reason,
    status: "pending",
    requestedAt: nowIso(),
  };
}

export function resolveApproval(
  request: ApprovalRequest,
  grantedIds: string[],
): ApprovalRequest {
  if (grantedIds.includes(request.id)) return { ...request, status: "approved" };
  return request;
}
