import type { ExecutionMode } from "../../core/domain/index.ts";
import { selectModel } from "../../intelligence/model-selection/index.ts";

export function routeModel(mode: ExecutionMode, preferred?: string) {
  const candidate = selectModel(mode, preferred);
  if (mode === "strict-local" && candidate.network) {
    return selectModel("strict-local");
  }
  return candidate;
}
