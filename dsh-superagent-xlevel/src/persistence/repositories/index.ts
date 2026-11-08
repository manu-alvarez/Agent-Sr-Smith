import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { AuditRecord, ExecutionReport, MemoryRecord } from "../../core/domain/index.ts";

export class SqliteRepository {
  private readonly db: DatabaseSync;

  constructor(filePath: string) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.db = new DatabaseSync(filePath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS executions (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        report_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        at TEXT NOT NULL,
        record_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS memory_records (
        id TEXT PRIMARY KEY,
        execution_id TEXT NOT NULL,
        type TEXT NOT NULL,
        record_json TEXT NOT NULL
      );
    `);
  }

  saveExecution(report: ExecutionReport): void {
    const serialized = JSON.stringify(stripSecrets(report));
    this.db
      .prepare(
        `INSERT INTO executions (id, status, profile_id, created_at, report_json)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET status = excluded.status, report_json = excluded.report_json`,
      )
      .run(report.executionId, report.status, report.profileId, report.plan.createdAt, serialized);
    const insertAudit = this.db.prepare(
      `INSERT OR REPLACE INTO audit_log (id, execution_id, at, record_json) VALUES (?, ?, ?, ?)`,
    );
    for (const record of report.audit) insertAudit.run(record.id, report.executionId, record.at, JSON.stringify(record));
    const insertMemory = this.db.prepare(
      `INSERT OR REPLACE INTO memory_records (id, execution_id, type, record_json) VALUES (?, ?, ?, ?)`,
    );
    for (const record of report.memory) {
      insertMemory.run(record.id, report.executionId, record.type, JSON.stringify(record));
    }
  }

  getExecution(id: string): ExecutionReport | undefined {
    const row = this.db.prepare(`SELECT report_json FROM executions WHERE id = ?`).get(id) as
      | { report_json: string }
      | undefined;
    return row ? (JSON.parse(row.report_json) as ExecutionReport) : undefined;
  }

  listExecutions(): Array<{ id: string; status: string; profileId: string }> {
    const rows = this.db
      .prepare(`SELECT id, status, profile_id FROM executions ORDER BY created_at DESC`)
      .all() as Array<{ id: string; status: string; profile_id: string }>;
    return rows.map((row) => ({ id: row.id, status: row.status, profileId: row.profile_id }));
  }

  listAudit(executionId: string): AuditRecord[] {
    const rows = this.db.prepare(`SELECT record_json FROM audit_log WHERE execution_id = ?`).all(executionId) as Array<{
      record_json: string;
    }>;
    return rows.map((row) => JSON.parse(row.record_json) as AuditRecord);
  }

  listMemory(executionId: string): MemoryRecord[] {
    const rows = this.db
      .prepare(`SELECT record_json FROM memory_records WHERE execution_id = ?`)
      .all(executionId) as Array<{ record_json: string }>;
    return rows.map((row) => JSON.parse(row.record_json) as MemoryRecord);
  }

  close(): void {
    this.db.close();
  }
}

function stripSecrets(report: ExecutionReport): ExecutionReport {
  let json = JSON.stringify(report);
  const values = new Set<string>();
  const pattern = /(api[_-]?key|secret|password|token)=([^"\\\s]+)/gi;
  for (const match of json.matchAll(pattern)) {
    const secret = match[2];
    if (secret && secret.length > 3 && secret !== "[redacted]") values.add(secret);
  }
  json = json.replace(pattern, "$1=[redacted]");
  for (const value of values) json = json.split(value).join("[redacted]");
  return JSON.parse(json) as ExecutionReport;
}
