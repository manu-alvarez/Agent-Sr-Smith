export const SCHEMA_VERSION = "1.0.0" as const;

export type ExecutionMode = "strict-local" | "local-runtime";

export type ProfileId =
  | "research"
  | "engineering"
  | "autonomous"
  | "security"
  | "full"
  | "headless"
  | "product"
  | "data"
  | "ops";

export type Phase =
  | "received"
  | "analysis"
  | "planning"
  | "policy_validation"
  | "task_graph"
  | "scheduling"
  | "delegation"
  | "execution"
  | "verification"
  | "recovery"
  | "completed"
  | "blocked"
  | "failed";

export type TaskStatus =
  | "pending"
  | "ready"
  | "running"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled";

export type OperationClass =
  | "analyze"
  | "sandbox-read"
  | "sandbox-write"
  | "test"
  | "git-write"
  | "network"
  | "secrets"
  | "external-delete"
  | "production-change";

export type ModuleStatus = "implemented" | "reference" | "contract" | "planned";

export interface ModuleDescriptor {
  id: string;
  name: string;
  status: ModuleStatus;
  responsibility: string;
  mustNot: string;
}

export interface AgentPermissions {
  filesystem: "none" | "workspace" | "restricted";
  network: boolean;
  shell: boolean;
  git: boolean;
}

export interface AgentLimits {
  maxSteps: number;
  maxTokens?: number;
  timeoutMs: number;
  maxToolCalls: number;
}

export interface AgentSpec {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  role: string;
  description: string;
  model: {
    provider: string;
    modelId: string;
    fallback?: string[];
  };
  capabilities: string[];
  tools: string[];
  permissions: AgentPermissions;
  limits: AgentLimits;
  policies: string[];
  promptRef: string;
  enabled: boolean;
}

export interface TaskBudget {
  maxSteps: number;
  timeoutMs: number;
  maxRetries: number;
}

export interface Task {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  parentId?: string;
  projectId: string;
  type: string;
  title: string;
  description: string;
  assignedRole?: string;
  assignedAgentId?: string;
  dependencies: string[];
  status: TaskStatus;
  acceptanceCriteria: string[];
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  budget: TaskBudget;
  attempts: number;
  requiresApproval: boolean;
  operation: OperationClass;
  blockedReason?: string;
}

export interface Plan {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  projectId: string;
  profileId: ProfileId;
  objective: string;
  summary: string;
  successCriteria: string[];
  assumptions: string[];
  nonGoals: string[];
  risks: string[];
  tasks: Task[];
  createdAt: string;
}

export interface TaskGraphSnapshot {
  schemaVersion: typeof SCHEMA_VERSION;
  planId: string;
  tasks: Task[];
  edges: Array<{ from: string; to: string }>;
  cycle: string[] | null;
}

export interface ModelMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: unknown;
}

export interface ModelRequest {
  schemaVersion: typeof SCHEMA_VERSION;
  requestId: string;
  sessionId: string;
  agentId: string;
  model: { provider: string; modelId: string };
  messages: ModelMessage[];
  tools?: ToolDefinition[];
  parameters: {
    temperature?: number;
    maxOutputTokens?: number;
    reasoningEffort?: string;
    responseFormat?: "text" | "json";
  };
  constraints: { timeoutMs: number; maxRetries: number };
  metadata: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ModelResponse {
  schemaVersion: typeof SCHEMA_VERSION;
  requestId: string;
  provider: string;
  modelId: string;
  status: "completed" | "failed" | "incomplete";
  output: { text?: string; toolCalls?: ToolCall[]; structured?: unknown };
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  finishReason: "stop" | "tool_calls" | "length" | "refusal" | "error";
  latencyMs: number;
  error?: { code: string; message: string; retryable: boolean };
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolManifest {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  version: string;
  description: string;
  source: { type: "mcp" | "native" | "plugin"; identifier: string };
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  capabilities: string[];
  permissions: {
    network: boolean;
    filesystem: boolean;
    shell: boolean;
    requiresApproval: boolean;
  };
  execution: { timeoutMs: number; retryable: boolean; idempotent: boolean };
}

export interface ToolResult {
  schemaVersion: typeof SCHEMA_VERSION;
  callId: string;
  toolId: string;
  status: "completed" | "denied" | "failed";
  output?: unknown;
  error?: { code: string; message: string; retryable: boolean };
  latencyMs: number;
}

export interface CapabilityDescriptor {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  kind: "model" | "tool" | "runtime";
  name: string;
  declared: Record<string, unknown>;
  verified: Record<string, unknown> | null;
  restrictions: string[];
}

export interface ModelCapability extends CapabilityDescriptor {
  kind: "model";
  provider: string;
  modelId: string;
}

export type MemoryType = "working" | "episodic" | "semantic" | "procedural";

export interface MemoryRecord {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  type: MemoryType;
  projectId?: string;
  agentId?: string;
  content: string;
  provenance: { source: string; createdAt: string; confidence?: number };
  metadata: Record<string, unknown>;
}

export interface ExecutionCheckpoint {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  executionId: string;
  sequence: number;
  phase: Phase;
  state: {
    completedTaskIds: string[];
    pendingTaskIds: string[];
    taskStatuses: Record<string, TaskStatus>;
  };
  createdAt: string;
  checksum: string;
}

export interface DshEvent<T = unknown> {
  eventId: string;
  eventType: string;
  schemaVersion: typeof SCHEMA_VERSION;
  aggregateId: string;
  correlationId: string;
  causationId?: string;
  timestamp: string;
  payload: T;
  metadata: { producer: string; traceId?: string };
}

export interface PolicyRule {
  id: string;
  operation: OperationClass;
  effect: "allow" | "deny" | "require-approval";
  modes?: ExecutionMode[];
  reason: string;
}

export interface Policy {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  version: string;
  rules: PolicyRule[];
}

export interface PolicyDecision {
  operation: OperationClass;
  effect: "allow" | "deny" | "require-approval";
  ruleId: string;
  reason: string;
}

export interface ApprovalRequest {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  executionId: string;
  taskId?: string;
  operation: OperationClass;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export interface AuditRecord {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  executionId: string;
  at: string;
  actor: string;
  action: string;
  outcome: "allowed" | "denied" | "completed" | "failed" | "escalated";
  details: Record<string, unknown>;
}

export interface VerificationCheck {
  id: string;
  criterion: string;
  passed: boolean;
  evidence: string;
}

export interface VerificationReport {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  executionId: string;
  accepted: boolean;
  checks: VerificationCheck[];
  reviewer: string;
  summary: string;
  createdAt: string;
}

export interface RecoveryAction {
  kind: "retry" | "replan" | "rollback" | "escalate";
  taskId?: string;
  reason: string;
}

export interface RecoveryPlan {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  executionId: string;
  diagnosis: string;
  actions: RecoveryAction[];
  budgetRemaining: number;
  createdAt: string;
}

export interface PluginManifest {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  version: string;
  type: string;
  contracts: string[];
  capabilities: string[];
  permissions: string[];
  dshVersion: string;
  entry: string;
  enabled: boolean;
}

export interface Ticket {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  projectId: string;
  title: string;
  body: string;
  status: "open" | "assigned" | "done" | "cancelled";
  source: string;
  linkedTaskIds: string[];
}

export interface AgentResult {
  schemaVersion: typeof SCHEMA_VERSION;
  agentId: string;
  taskId: string;
  status: "completed" | "failed" | "blocked";
  summary: string;
  outputs: Record<string, unknown>;
  evidence: string[];
}

export interface WorkspaceFile {
  path: string;
  content: string;
}

export interface WorkspaceChange {
  path: string;
  op: "write" | "delete";
  before?: string;
  after?: string;
}

export interface TimelineEntry {
  id: string;
  at: string;
  phase: Phase;
  title: string;
  detail: string;
  taskId?: string;
  level: "info" | "warn" | "error" | "ok";
}

export interface Analysis {
  language: "es" | "en";
  signals: Array<"software" | "research" | "security" | "operations" | "documentation">;
  complexity: "low" | "medium" | "high";
  risks: string[];
  subjects: string[];
  sensitive: boolean;
}

export interface ExecutionReport {
  schemaVersion: typeof SCHEMA_VERSION;
  executionId: string;
  status: "completed" | "blocked" | "failed";
  phase: Phase;
  mode: ExecutionMode;
  profileId: ProfileId;
  objective: string;
  analysis: Analysis;
  plan: Plan;
  tasks: Task[];
  timeline: TimelineEntry[];
  checkpoints: ExecutionCheckpoint[];
  verification: VerificationReport;
  recovery?: RecoveryPlan;
  approvals: ApprovalRequest[];
  audit: AuditRecord[];
  memory: MemoryRecord[];
  knowledgeHits: Array<{ id: string; title: string; excerpt: string; score: number }>;
  workspace: WorkspaceFile[];
  changes: WorkspaceChange[];
  events: DshEvent[];
  watchdog: {
    blockedTasks: string[];
    loops: string[];
    budgetExhausted: boolean;
    deviations: string[];
  };
  usage: { steps: number; toolCalls: number; referenceCalls: number };
  limitations: string[];
  moduleStatus: ModuleDescriptor[];
}

export interface RunInput {
  objective: string;
  profileId?: ProfileId;
  mode?: ExecutionMode;
  projectId?: string;
  approvals?: string[];
}
