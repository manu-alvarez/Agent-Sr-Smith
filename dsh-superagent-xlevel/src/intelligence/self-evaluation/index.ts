export function score(passed: number, total: number): number {
  if (total <= 0) return 0;
  return Number((passed / total).toFixed(3));
}
