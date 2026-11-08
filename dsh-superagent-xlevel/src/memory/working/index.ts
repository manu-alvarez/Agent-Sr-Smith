import { MemoryEngine } from "../store.ts";
export function note(engine: MemoryEngine, content: string, projectId: string) {
  return engine.remember({ type: "working", content, projectId, source: "working" });
}
