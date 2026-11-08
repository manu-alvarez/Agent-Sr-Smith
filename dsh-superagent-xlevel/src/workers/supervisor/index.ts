export interface WatchdogView {
  repeatedReadySet: boolean;
  blocked: number;
}

export function inspect(readySignatures: number, blocked: number): WatchdogView {
  return { repeatedReadySet: readySignatures > 2, blocked };
}
