import { AgentRegistry } from "../agents/registry/index.ts";
import { loadConfig, type DshConfig } from "./configuration.ts";
import { ModelGateway } from "../models/gateway/index.ts";
import { createEventBus, type EventBus } from "../core/events/index.ts";

export interface AppContainer {
  config: DshConfig;
  agents: AgentRegistry;
  gateway: ModelGateway;
  events: EventBus;
}

/** Composition root. Domain modules do not import this file. */
export function createContainer(env?: Record<string, string | undefined>): AppContainer {
  const config = loadConfig(env);
  return {
    config,
    agents: new AgentRegistry(),
    gateway: ModelGateway.reference(config.mode),
    events: createEventBus(),
  };
}
