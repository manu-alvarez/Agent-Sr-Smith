import type { DshEvent } from "../domain/index.ts";
import { SCHEMA_VERSION } from "../domain/index.ts";
import { createId, nowIso } from "../identifiers/index.ts";

export interface EventBus {
  publish<T>(event: DshEvent<T>): void;
  history(): DshEvent[];
  subscribe(listener: (event: DshEvent) => void): () => void;
}

export function createEvent<T>(input: {
  eventType: string;
  aggregateId: string;
  correlationId: string;
  causationId?: string;
  payload: T;
  producer: string;
  traceId?: string;
}): DshEvent<T> {
  return {
    eventId: createId("evt"),
    eventType: input.eventType,
    schemaVersion: SCHEMA_VERSION,
    aggregateId: input.aggregateId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    timestamp: nowIso(),
    payload: input.payload,
    metadata: { producer: input.producer, traceId: input.traceId },
  };
}

export function createEventBus(): EventBus {
  const events: DshEvent[] = [];
  const listeners = new Set<(event: DshEvent) => void>();
  return {
    publish(event) {
      events.push(event);
      for (const listener of listeners) listener(event);
    },
    history() {
      return [...events];
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
