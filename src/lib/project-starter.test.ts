import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { starterFiles } from "./project-starter.ts";

function runStarter(framework: "cli" | "api" | "library") {
  const { slug, files } = starterFiles({
    name: "Checkpoint local",
    objective: "Guardar un checkpoint con suma de verificación.",
    framework,
    ide: ["opencode"],
  });
  const root = mkdtempSync(join(tmpdir(), "smith-starter-"));
  try {
    for (const [path, content] of Object.entries(files)) {
      const full = join(root, path);
      mkdirSync(join(full, ".."), { recursive: true });
      writeFileSync(full, content);
    }
    const result = spawnSync("node", ["--experimental-strip-types", "--test", "src"], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(slug, "checkpoint-local");
    assert.match(files["README.md"] ?? "", /npm test/);
    assert.match(files["package.json"] ?? "", /"start"/);
    assert.ok(files["opencode.json"]);
    assert.ok(files["AGENTS.md"]);
    assert.ok(files[".opencode/agents/builder.md"]);
    assert.ok(files[".opencode/commands/test.md"]);
    assert.ok(files[".opencode/skills/proyecto/SKILL.md"]);
    assert.equal(files["CLAUDE.md"], undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("el CLI elegido se prueba solo", () => runStarter("cli"));
test("la API elegida se prueba sola", () => runStarter("api"));
test("la biblioteca elegida se prueba sola", () => runStarter("library"));
