export interface Contribution { role: string; summary: string }
export function merge(contributions: Contribution[]): { summaries: string[]; duplicateRoles: string[] } {
  const seen = new Set<string>();
  const duplicateRoles: string[] = [];
  for (const item of contributions) {
    if (seen.has(item.role)) duplicateRoles.push(item.role);
    seen.add(item.role);
  }
  return { summaries: contributions.map((item) => `${item.role}: ${item.summary}`), duplicateRoles };
}
