/** Browser-safe entry. Do not import node:* from this graph. */

export { runObjective } from "./orchestration/orchestrator/index.ts";
export { PROFILES, profileById } from "./agents/profiles/index.ts";
export { ROLES, AGENT_SPECS } from "./agents/specialists/index.ts";
export { DEFAULT_POLICY, explainPolicy, decide } from "./governance/policies/index.ts";
export { MODULES } from "./meta/modules.ts";
export { CONTRACTS, COMPATIBILITY_RULES } from "./core/contracts/index.ts";
export { CAPABILITIES } from "./models/capabilities/index.ts";
export { NATIVE_TOOLS } from "./tools/fabric.ts";
export { analyzeObjective } from "./intelligence/analysis.ts";
export { searchKnowledge } from "./knowledge/retrieval/index.ts";
export { PHASE_ORDER } from "./core/lifecycle/index.ts";
export { SCHEMA_VERSION } from "./core/domain/index.ts";

export type {
  ExecutionReport,
  RunInput,
  ProfileId,
  ExecutionMode,
  Task,
  Plan,
  Phase,
  ModuleDescriptor,
} from "./core/domain/index.ts";
