import type { AgentSpec } from "../../core/domain/index.ts";
import { toAgentSpec, roleByName } from "../specialists/index.ts";

export interface AgentOverrides {
  provider?: string;
  modelId?: string;
  enabled?: boolean;
  maxSteps?: number;
}

/** Builds a spec from a known role. Unknown roles are rejected. */
export function createAgent(role: string, overrides: AgentOverrides = {}): AgentSpec {
  const definition = roleByName(role);
  const spec = toAgentSpec(definition, overrides.enabled ?? true);
  if (overrides.provider) spec.model.provider = overrides.provider;
  if (overrides.modelId) spec.model.modelId = overrides.modelId;
  if (overrides.maxSteps) spec.limits.maxSteps = overrides.maxSteps;
  return spec;
}
