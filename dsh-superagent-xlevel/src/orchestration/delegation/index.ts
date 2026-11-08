import type { AgentSpec, Task } from "../../core/domain/index.ts";
import { AgentRegistry } from "../../agents/registry/index.ts";

export function delegate(task: Task, registry = new AgentRegistry()): { task: Task; agent: AgentSpec } {
  const role = task.assignedRole ?? "planner";
  const agent = registry.byRole(role);
  if (!agent) throw new Error(`No enabled agent for role ${role}`);
  return {
    agent,
    task: { ...task, assignedAgentId: agent.id, assignedRole: role },
  };
}
