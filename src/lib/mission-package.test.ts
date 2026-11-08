import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { unzipSync } from "fflate";
import { runObjective } from "../../dsh-superagent-xlevel/src/public.ts";
import { composeMissionZip, missionFiles } from "./mission-package.ts";

test("a mission zip keeps the scaffolding and adds the run", () => {
  const scaffolding = readFileSync("public/sr-smith-c57fdd3.zip");
  const report = runObjective({
    objective: "Implement a checksummed checkpoint inside the local sandbox.",
    profileId: "engineering",
    mode: "strict-local",
  });
  const files = missionFiles({
    objective: report.objective,
    profileId: "engineering",
    profileName: "Engineering X",
    roles: ["developer", "reviewer"],
    report,
    projectName: "Checkpoint local",
    framework: "cli",
    ide: ["opencode", "claude", "codex", "vscode", "cursor"],
  });
  const packed = composeMissionZip(new Uint8Array(scaffolding), files);
  const unzipped = unzipSync(packed.bytes);
  assert.ok(unzipped["sr-smith/src/public.ts"]);
  assert.ok(unzipped["sr-smith/CLAUDE.md"]);
  assert.ok(unzipped["sr-smith/MANIFEST.txt"]);
  const mission = Object.keys(unzipped).filter((path) => path.includes("/misiones/"));
  assert.ok(mission.some((path) => path.endsWith("/OBJETIVO.md")));
  assert.ok(mission.some((path) => path.endsWith("/plan.md")));
  assert.ok(mission.some((path) => path.endsWith("/informe.json")));
  assert.ok(unzipped["sr-smith/EMPEZAR.md"]);
  assert.ok(unzipped["sr-smith/proyectos/checkpoint-local/package.json"]);
  assert.ok(unzipped["sr-smith/proyectos/checkpoint-local/src/main.ts"]);
  assert.ok(unzipped["sr-smith/proyectos/checkpoint-local/.vscode/tasks.json"]);
  assert.ok(unzipped["sr-smith/proyectos/checkpoint-local/opencode.json"]);
  assert.ok(unzipped["sr-smith/proyectos/checkpoint-local/AGENTS.md"]);
  assert.ok(unzipped["sr-smith/proyectos/checkpoint-local/CLAUDE.md"]);
  assert.ok(unzipped["sr-smith/proyectos/checkpoint-local/.opencode/skills/proyecto/SKILL.md"]);
});
