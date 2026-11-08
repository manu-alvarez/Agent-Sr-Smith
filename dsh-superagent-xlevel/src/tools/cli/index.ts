const ALLOWED = new Set(["git status", "git diff", "npm test"]);

export function reviewCommand(command: string): { allowed: boolean; reason: string } {
  if (!ALLOWED.has(command)) return { allowed: false, reason: "comando fuera de la lista" };
  return { allowed: true, reason: "lista blanca; el runtime de referencia no lo engendra" };
}
