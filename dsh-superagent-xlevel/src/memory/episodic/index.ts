import { MemoryEngine } from "../store.ts";
export function episode(engine: MemoryEngine, content: string, projectId: string) {
  return engine.remember({ type: "episodic", content, projectId, source: "episode" });
}
