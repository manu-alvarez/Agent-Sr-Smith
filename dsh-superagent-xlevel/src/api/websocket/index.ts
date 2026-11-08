export const WEBSOCKET_STATUS = "contract" as const;
export interface SocketEvent { type: string; executionId: string }
export function executionEvent(executionId: string, type: string): SocketEvent {
  return { type, executionId };
}
