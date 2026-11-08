import type { MemoryRecord, MemoryType } from "../core/domain/index.ts";
import { SCHEMA_VERSION } from "../core/domain/index.ts";
import { createId, nowIso } from "../core/identifiers/index.ts";

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-záéíóúñ0-9]+/i)
      .filter((token) => token.length > 3),
  );
}

export class MemoryEngine {
  private readonly records: MemoryRecord[] = [];

  remember(input: {
    type: MemoryType;
    content: string;
    projectId?: string;
    agentId?: string;
    source: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }): MemoryRecord {
    const record: MemoryRecord = {
      schemaVersion: SCHEMA_VERSION,
      id: createId("mem"),
      type: input.type,
      projectId: input.projectId,
      agentId: input.agentId,
      content: input.content,
      provenance: {
        source: input.source,
        createdAt: nowIso(),
        confidence: input.confidence,
      },
      metadata: input.metadata ?? {},
    };
    this.records.push(record);
    return record;
  }

  recall(query: string, type?: MemoryType, limit = 5): MemoryRecord[] {
    const queryTokens = tokens(query);
    return this.records
      .filter((record) => (type ? record.type === type : true))
      .map((record) => {
        const recordTokens = tokens(record.content);
        let score = 0;
        for (const token of queryTokens) if (recordTokens.has(token)) score += 1;
        return { record, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.record);
  }

  /** Promote repeated working notes into a semantic record. */
  consolidate(projectId?: string): MemoryRecord[] {
    const working = this.records.filter(
      (record) => record.type === "working" && (!projectId || record.projectId === projectId),
    );
    const counts = new Map<string, number>();
    for (const record of working) {
      const key = record.content.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const created: MemoryRecord[] = [];
    for (const [content, count] of counts) {
      if (count < 2) continue;
      const already = this.records.some(
        (record) => record.type === "semantic" && record.content.trim().toLowerCase() === content,
      );
      if (already) continue;
      created.push(
        this.remember({
          type: "semantic",
          content,
          projectId,
          source: "memory.consolidation",
          confidence: Math.min(0.95, 0.5 + count * 0.15),
          metadata: { promotedFrom: "working", occurrences: count },
        }),
      );
    }
    return created;
  }

  all(): MemoryRecord[] {
    return [...this.records];
  }
}
