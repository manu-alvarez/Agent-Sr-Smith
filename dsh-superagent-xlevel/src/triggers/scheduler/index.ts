export interface Schedule {
  id: string;
  intervalMs: number;
  nextAt: number;
}

export function nextSchedule(id: string, intervalMs: number, now = Date.now()): Schedule {
  if (intervalMs < 1000) throw new Error("el intervalo mínimo es 1000 ms");
  return { id, intervalMs, nextAt: now + intervalMs };
}
