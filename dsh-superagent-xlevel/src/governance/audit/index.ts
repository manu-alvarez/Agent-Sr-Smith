import type { AuditRecord } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { createId, nowIso } from "../../core/identifiers/index.ts";

const SECRET_PATTERN = /(api[_-]?key|secret|password|token)\s*[:=]\s*\S+/gi;

export function redact(value: string): string {
  return value.replace(SECRET_PATTERN, "$1=[redacted]");
}

export function audit(input: {
  executionId: string;
  actor: string;
  action: string;
  outcome: AuditRecord["outcome"];
  details?: Record<string, unknown>;
}): AuditRecord {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId("aud"),
    executionId: input.executionId,
    at: nowIso(),
    actor: input.actor,
    action: input.action,
    outcome: input.outcome,
    details: JSON.parse(redact(JSON.stringify(input.details ?? {}))) as Record<string, unknown>,
  };
}
