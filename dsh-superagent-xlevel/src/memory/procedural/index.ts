import { MemoryEngine } from "../store.ts";
export function procedure(engine: MemoryEngine, content: string) {
  return engine.remember({ type: "procedural", content, source: "procedure", confidence: 0.7 });
}
