import type { Phase } from "../domain/index.ts";
import { canTransition } from "../lifecycle/index.ts";

export function reducePhase(current: Phase, next: Phase): Phase {
  if (!canTransition(current, next)) throw new Error(`transición ilegal ${current} -> ${next}`);
  return next;
}
