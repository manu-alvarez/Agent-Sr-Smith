import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import { AGENT_SPECS } from "../../src/agents/specialists/index.ts";
import { CAPABILITIES } from "../../src/models/capabilities/index.ts";
import { DEFAULT_POLICY } from "../../src/governance/policies/index.ts";
import { NATIVE_TOOLS } from "../../src/tools/fabric.ts";
import { runObjective } from "../../src/public.ts";

const ajv = new Ajv2020({ allErrors: true, strict: false });

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith(".json") ? [path] : [];
  });
}

function load(path: string): object {
  return JSON.parse(readFileSync(path, "utf8")) as object;
}

describe("json schemas", () => {
  const files = walk("schemas");

  it("compiles every schema", () => {
    expect(files.length).toBeGreaterThan(20);
    for (const file of files) {
      const validate = ajv.compile(load(file));
      expect(typeof validate).toBe("function");
    }
  });

  it("accepts live domain objects", () => {
    const validate = (file: string, data: unknown) => {
      const check = new Ajv2020({ allErrors: true, strict: false }).compile(load(file));
      const ok = check(data);
      expect(ok, `${file} ${JSON.stringify(check.errors)}`).toBe(true);
    };
    for (const spec of AGENT_SPECS) validate("schemas/agents/agent-spec.schema.json", spec);
    validate("schemas/governance/policy.schema.json", DEFAULT_POLICY);
    for (const capability of CAPABILITIES) validate("schemas/models/capability.schema.json", capability);
    for (const tool of NATIVE_TOOLS) validate("schemas/tools/tool-manifest.schema.json", tool);
    const report = runObjective({
      objective: "Implement a checksummed checkpoint inside the local sandbox.",
      profileId: "engineering",
      mode: "strict-local",
    });
    validate("schemas/orchestration/plan.schema.json", report.plan);
    for (const task of report.tasks) validate("schemas/orchestration/task.schema.json", task);
    for (const checkpoint of report.checkpoints) validate("schemas/execution/checkpoint.schema.json", checkpoint);
    for (const event of report.events) validate("schemas/events/event-envelope.schema.json", event);
    for (const record of report.memory) validate("schemas/memory/memory-record.schema.json", record);
    validate("schemas/execution/execution.schema.json", {
      schemaVersion: report.schemaVersion,
      executionId: report.executionId,
      status: report.status,
      phase: report.phase,
      mode: report.mode,
      profileId: report.profileId,
      objective: report.objective,
    });
  });
});
