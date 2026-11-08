export interface OutboxMessage { id: string; type: string; payload: unknown; dispatched: boolean }
export function enqueue(id: string, type: string, payload: unknown): OutboxMessage {
  return { id, type, payload, dispatched: false };
}
export function markDispatched(message: OutboxMessage): OutboxMessage {
  return { ...message, dispatched: true };
}
