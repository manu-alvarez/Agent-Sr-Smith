import assert from "node:assert/strict";
import test from "node:test";
import { CAPABILITIES, ROLES } from "../../dsh-superagent-xlevel/src/public.ts";
import { agentCode, agentFiles, clampSelection, fullSelection, SKILLS, TOOLS } from "./agent-export.ts";

test("Full incluye cada rol, herramienta y proveedor que existe", () => {
  const code = JSON.parse(agentCode(fullSelection())) as {
    id: string;
    roles: Array<{ id: string }>;
    tools: string[];
    providers: Array<{ provider: string }>;
    strategies: string[];
    skills: string[];
    capacities: string[];
    mode: string;
    system: string;
  };
  assert.equal(code.id, "sr-smith-full");
  assert.deepEqual(
    code.roles.map((item) => item.id),
    ROLES.map((item) => item.role),
  );
  assert.deepEqual(code.tools, TOOLS.map((item) => item.name));
  assert.deepEqual(
    code.providers.map((item) => item.provider),
    CAPABILITIES.map((item) => item.provider),
  );
  assert.equal(code.strategies.length, 14);
  assert.equal(code.skills.length, SKILLS.length);
  assert.ok(code.skills.length >= 20);
  assert.equal(code.capacities.length, 18);
  assert.equal(code.mode, "full-access");
  assert.match(code.system, /acceso total/i);
  assert.match(code.system, /navegador/);
  assert.match(code.system, /Orchestrator/);
  assert.match(code.system, /gemma4:latest/);
});

test("Personalizada no puede pasar del techo de Full ni inventar ids", () => {
  const clamped = clampSelection({
    roles: ["developer", "no-existe"],
    tools: ["workspace.read", "shell.exec"],
    providers: ["ollama", "inventado"],
    strategies: ["planning", "nope"],
    skills: ["review", "browser"],
    capacities: ["codigo", "no-existe"],
    mode: "local-runtime",
    limits: { maxSteps: 10_000, maxParallel: 0, timeoutMs: 10 },
  });
  assert.deepEqual(clamped.roles, ["developer"]);
  assert.deepEqual(clamped.tools, ["workspace.read", "shell.exec"]);
  assert.deepEqual(clamped.providers, ["ollama"]);
  assert.deepEqual(clamped.strategies, ["planning"]);
  assert.deepEqual(clamped.skills, ["review"]);
  assert.deepEqual(clamped.capacities, ["codigo"]);
  assert.equal(clamped.mode, "local-runtime");
  assert.equal(clamped.limits.maxSteps, 10_000);
  assert.equal(clamped.limits.maxParallel, 1);
  assert.equal(clamped.limits.timeoutMs, 1_000);
  const code = JSON.parse(agentCode(clamped)) as { id: string; system: string };
  assert.equal(code.id, "sr-smith-custom");
  assert.match(code.system, /Developer/);
  assert.doesNotMatch(code.system, /Orchestrator/);
});

test("el paquete del agente separa skills, agentes y el índice", () => {
  const files = agentFiles(fullSelection());
  assert.match(files["AGENTE.md"] ?? "", /gemma4:latest/);
  assert.ok(files["agents/orchestrator.md"]);
  assert.ok(files["skills/review/SKILL.md"]);
  assert.ok(files["capacidades/codigo.md"]);
  assert.ok(files["tools/browser.open.json"]);
  assert.match(files["policy.json"] ?? "", /full-access|network/);
  assert.ok(files["knowledge.json"]);
  assert.match(files["INDEX.md"] ?? "", /AGENTE.md/);
});
