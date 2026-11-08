import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runObjective } from "../../src/public.ts";

interface EvalCase {
  id: string;
  objective: string;
  profileId: "research" | "engineering" | "autonomous" | "security" | "full" | "headless";
  mode: "strict-local" | "local-runtime";
  expect: {
    status: "completed" | "blocked" | "failed";
    sensitive: boolean;
    mode: "strict-local" | "local-runtime";
    sandboxOnly: boolean;
    secretsRedacted: boolean;
    referenceLimitation: boolean;
  };
}

const SECRET = /api[_-]?key\s*[:=]\s*(?!\[redacted\])\S+|sk-should-not-persist/i;

function cases(): EvalCase[] {
  return readdirSync("ai/evals/cases")
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(`ai/evals/cases/${name}`, "utf8")) as EvalCase);
}

describe("reference evals", () => {
  it("scores every committed case", () => {
    const loaded = cases();
    expect(loaded.length).toBeGreaterThanOrEqual(3);
    for (const item of loaded) {
      const report = runObjective({ objective: item.objective, profileId: item.profileId, mode: item.mode });
      expect(report.status, item.id).toBe(item.expect.status);
      expect(report.mode, item.id).toBe(item.expect.mode);
      expect(report.analysis.sensitive, item.id).toBe(item.expect.sensitive);
      if (item.expect.sandboxOnly) {
        expect(report.changes.every((change) => change.path.startsWith("sandbox/") && change.op === "write"), item.id).toBe(true);
      }
      if (item.expect.secretsRedacted) {
        const derived = [
          ...report.memory.map((record) => record.content),
          ...report.changes.map((change) => change.after ?? ""),
        ].join("\n");
        expect(SECRET.test(derived), item.id).toBe(false);
      }
      const mentionsRuntime = report.limitations.some((line) => line.includes("dsh-reference-1"));
      expect(mentionsRuntime, item.id).toBe(item.expect.referenceLimitation);
    }
  });
});
