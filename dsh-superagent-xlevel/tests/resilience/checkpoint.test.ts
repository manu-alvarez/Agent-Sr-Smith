import { describe, expect, it } from "vitest";
import { runObjective } from "../../src/public.ts";
import { verifyCheckpoint } from "../../src/orchestration/task-graph/index.ts";
import { restoreStatuses } from "../../src/recovery/checkpoint/index.ts";

describe("checkpoints", () => {
  it("restores only intact checkpoints", () => {
    const report = runObjective({ objective: "Implement checksum verification for checkpoints.", profileId: "autonomous" });
    const checkpoint = report.checkpoints[0];
    expect(checkpoint).toBeTruthy();
    expect(verifyCheckpoint(checkpoint!)).toBe(true);
    expect(restoreStatuses(checkpoint!)).not.toHaveProperty("error");
    const broken = { ...checkpoint!, checksum: "deadbeef" };
    expect(restoreStatuses(broken)).toEqual({ error: "checksum inválido" });
  });
});
