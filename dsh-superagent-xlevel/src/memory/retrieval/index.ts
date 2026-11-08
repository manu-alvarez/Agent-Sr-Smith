import { MemoryEngine } from "../store.ts";
import type { MemoryType } from "../../core/domain/index.ts";
export function recall(engine: MemoryEngine, query: string, type?: MemoryType) {
  return engine.recall(query, type);
}
