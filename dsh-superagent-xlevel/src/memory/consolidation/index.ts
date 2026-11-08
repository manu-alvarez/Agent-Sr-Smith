import { MemoryEngine } from "../store.ts";
export function consolidateProject(engine: MemoryEngine, projectId?: string) {
  return engine.consolidate(projectId);
}
