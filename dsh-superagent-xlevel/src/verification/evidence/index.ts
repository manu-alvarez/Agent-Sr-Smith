export function hasEvidence(items: string[]): boolean {
  return items.some((item) => item.trim().length > 8);
}
