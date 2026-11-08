import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import { PROFILES } from "../../src/agents/profiles/index.ts";
import { DEFAULT_POLICY } from "../../src/governance/policies/index.ts";
import { NATIVE_TOOLS } from "../../src/tools/fabric.ts";

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("config parity", () => {
  it("stores the executable policy", () => {
    const file = readJson("config/policies/default.json");
    expect(file.id).toBe(DEFAULT_POLICY.id);
    expect(file.name).toBe(DEFAULT_POLICY.name);
    expect(file.version).toBe(DEFAULT_POLICY.version);
    expect(file.schemaVersion).toBe(DEFAULT_POLICY.schemaVersion);
    expect(file.rules).toEqual(DEFAULT_POLICY.rules);
    expect(file.defaultEffect).toBe("deny");
  });

  it("stores each profile with its budget", () => {
    for (const profile of PROFILES) {
      const file = readJson(`config/profiles/${profile.id}.json`);
      expect(file).toMatchObject({
        id: profile.id,
        name: profile.name,
        summary: profile.summary,
        roles: profile.roles,
        tools: profile.tools,
        capabilities: profile.capabilities,
        limits: profile.limits,
        policy: "pol_default_autonomy",
        modeDefault: "strict-local",
      });
    }
  });

  it("stores native tools with the same permissions", () => {
    const file = readJson("config/tools/native.json");
    const tools = file.tools as Array<Record<string, unknown>>;
    expect(tools.map((tool) => tool.name)).toEqual(NATIVE_TOOLS.map((tool) => tool.name));
    for (const tool of NATIVE_TOOLS) {
      const declared = tools.find((item) => item.name === tool.name);
      expect(declared?.permissions).toEqual(tool.permissions);
      expect(declared?.execution).toEqual(tool.execution);
    }
  });
});

describe("schema examples", () => {
  it("validates every example shipped in schemas/", () => {
    const files = readdirSync("schemas", { recursive: true })
      .map(String)
      .filter((path) => path.endsWith(".json"))
      .map((path) => join("schemas", path));
    expect(files.length).toBeGreaterThan(20);
    for (const file of files) {
      const schema = readJson(file);
      const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
      const examples = schema.examples as unknown[];
      expect(examples?.length, file).toBeGreaterThan(0);
      expect(schema.title, file).toEqual(expect.any(String));
      expect(String(schema.description).length, file).toBeGreaterThan(40);
      for (const example of examples) {
        expect(validate(example), `${file} ${JSON.stringify(validate.errors)}`).toBe(true);
      }
    }
  });
});
