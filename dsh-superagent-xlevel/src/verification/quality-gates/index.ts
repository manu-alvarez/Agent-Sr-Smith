export const GATES = ["typecheck", "unit", "contract", "architecture", "schema"] as const;
export function gatePassed(name: (typeof GATES)[number], ok: boolean): { name: string; ok: boolean } {
  return { name, ok };
}
