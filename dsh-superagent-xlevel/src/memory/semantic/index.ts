import { MemoryEngine } from "../store.ts";
export function fact(engine: MemoryEngine, content: string, confidence: number) {
  return engine.remember({ type: "semantic", content, source: "semantic", confidence });
}
