import type { AgentSpec } from "../../core/domain/index.ts";
import { AGENT_SPECS } from "../specialists/index.ts";

export class AgentRegistry {
  private readonly agents = new Map<string, AgentSpec>();

  constructor(specs: AgentSpec[] = AGENT_SPECS) {
    for (const spec of specs) this.register(spec);
  }

  register(spec: AgentSpec): void {
    if (this.agents.has(spec.id)) {
      throw new Error(`Agent already registered: ${spec.id}`);
    }
    if (!spec.role || !spec.promptRef) {
      throw new Error(`Agent ${spec.id} is missing role or promptRef`);
    }
    this.agents.set(spec.id, structuredClone(spec));
  }

  get(id: string): AgentSpec | undefined {
    const spec = this.agents.get(id);
    return spec ? structuredClone(spec) : undefined;
  }

  byRole(role: string): AgentSpec | undefined {
    return [...this.agents.values()].find((spec) => spec.role === role && spec.enabled);
  }

  enabled(): AgentSpec[] {
    return [...this.agents.values()].filter((spec) => spec.enabled).map((spec) => structuredClone(spec));
  }

  list(): AgentSpec[] {
    return [...this.agents.values()].map((spec) => structuredClone(spec));
  }
}
