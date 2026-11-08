export const MIGRATIONS = [
  { id: "001_executions", statements: ["CREATE TABLE IF NOT EXISTS executions (id TEXT PRIMARY KEY, report_json TEXT NOT NULL)"] },
] as const;
