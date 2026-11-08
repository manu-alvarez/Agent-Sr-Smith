export function canRetry(attempts: number, maxRetries: number, idempotent: boolean): boolean {
  return idempotent && attempts <= maxRetries;
}
