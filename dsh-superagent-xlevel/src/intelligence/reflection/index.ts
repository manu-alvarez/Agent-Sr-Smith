export function reflect(summary: string, evidenceCount: number): { adequate: boolean; note: string } {
  if (evidenceCount < 1) return { adequate: false, note: "sin evidencia" };
  return { adequate: summary.trim().length > 12, note: summary };
}
