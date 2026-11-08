import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { startHttpServer } from "../../src/api/http/server.ts";
import { SqliteRepository } from "../../src/persistence/repositories/index.ts";
import { runObjective } from "../../src/public.ts";
import { parseGithubIssue } from "../../src/triggers/github/index.ts";
import { planWorktree } from "../../src/workers/worktree/index.ts";
import { rollback } from "../../src/recovery/rollback/index.ts";

describe("local adapters", () => {
  const servers: Array<{ close(): Promise<void> }> = [];
  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it("serves health and a run over HTTP", async () => {
    const server = await startHttpServer({ DSH_HOST: "127.0.0.1", DSH_PORT: "0", DSH_MODE: "strict-local" });
    servers.push(server);
    const health = await fetch(`${server.url}/health`);
    expect(health.status).toBe(200);
    const body = (await health.json()) as { status: string; agents: number };
    expect(body.status).toBe("ok");
    expect(body.agents).toBeGreaterThanOrEqual(19);
    const run = await fetch(`${server.url}/v1/runs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ objective: "Document the sandbox contract.", profileId: "headless" }),
    });
    expect(run.status).toBe(200);
    const report = (await run.json()) as { status: string; tasks: unknown[] };
    expect(report.status).toBe("completed");
    expect(report.tasks.length).toBeGreaterThan(0);
  });

  it("persists a report in sqlite without the raw secret pattern", () => {
    const dir = mkdtempSync(join(tmpdir(), "dsh-"));
    const repo = new SqliteRepository(join(dir, "state.sqlite"));
    const report = runObjective({
      objective: "Research policy boundaries. token=should-not-survive",
      profileId: "research",
    });
    repo.saveExecution(report);
    const loaded = repo.getExecution(report.executionId);
    repo.close();
    expect(loaded?.executionId).toBe(report.executionId);
    expect(JSON.stringify(loaded)).not.toContain("should-not-survive");
  });

  it("parses a github issue and plans a worktree path", () => {
    const issue = parseGithubIssue({ action: "opened", issue: { number: 7, title: "Checkpoint", body: "add checksum" } });
    expect(issue).toMatchObject({ number: 7, title: "Checkpoint" });
    const worktree = planWorktree("exe_abc");
    expect(worktree.path.startsWith(".dsh/worktrees/")).toBe(true);
    expect(worktree.command[0]).toBe("git");
  });

  it("rolls back a sandbox write", () => {
    const next = rollback(
      [{ path: "sandbox/a.ts", content: "new" }],
      [{ path: "sandbox/a.ts", op: "write", before: "old", after: "new" }],
    );
    expect(next).toEqual([{ path: "sandbox/a.ts", content: "old" }]);
  });
});
