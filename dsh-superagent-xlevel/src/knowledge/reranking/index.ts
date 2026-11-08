export function rerank<T extends { score: number }>(hits: T[], limit: number): T[] {
  return [...hits].sort((a, b) => b.score - a.score).slice(0, limit);
}
