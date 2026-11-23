import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { portableAgentFiles } from "./portable-agent.ts";

test("creates a runnable provider-neutral project without personal endpoints or secrets", () => {
  const files = portableAgentFiles({
    name: "Agente Smith",
    description: "Asistente de pruebas",
    systemPrompt: "Eres un agente útil.",
    model: "gemma4:latest"
  });
  assert.ok(files["package.json"]);
  assert.ok(files["src/index.mjs"]);
  assert.ok(files["src/doctor.mjs"]);
  assert.match(files[".env.example"] ?? "", /SMITH_BASE_URL=http:\/\/localhost:11434/);
  assert.match(files[".gitignore"] ?? "", /\.sr-smith\//);
  assert.doesNotMatch(files[".env.example"] ?? "", /100\.100\.2\.10/);
  assert.doesNotMatch(files[".env.example"] ?? "", /sk-[A-Za-z0-9]/);
  assert.match(files["src/index.mjs"] ?? "", /\/api\/chat/);
  assert.match(files["src/index.mjs"] ?? "", /\/chat\/completions/);
  assert.match(files["README-RUNTIME.md"] ?? "", /shell\.exec es opcional.*SMITH_ALLOW_SHELL=true/);
  assert.match(files["README-RUNTIME.md"] ?? "", /knowledge\.ingest/);
  assert.match(files["src/index.mjs"] ?? "", /\/orchestrate/);
  assert.match(files["src/orchestrator.mjs"] ?? "", /orchestrateGoal/);
  assert.match(files["src/mcp-server.mjs"] ?? "", /knowledge\.ingest/);
  assert.match(files["src/mcp-server.mjs"] ?? "", /knowledge\.stats/);
  assert.match(files["src/mcp-server.mjs"] ?? "", /\/api\/embed/);
  assert.ok(files["src/mcp-server.mjs"]);
  assert.ok(files["mcp.json"]);
  assert.ok(files[".mcp.json"]);
  assert.ok(files[".cursor/mcp.json"]);
  assert.ok(files[".opencode/agents/sr-smith.md"]);
  assert.match(files["mcp.json"] ?? "", /SMITH_ALLOW_SHELL/);
  assert.match(files["MCP-CONFIG.md"] ?? "", /SMITH_ALLOW_SHELL=true/);
  assert.match(files["src/index.mjs"] ?? "", /readFileSync/);
  for (const source of ["src/index.mjs", "src/orchestrator.mjs", "src/mcp-server.mjs"]) {
    const syntax = spawnSync(process.execPath, ["--check", "--input-type=module"], { input: files[source], encoding: "utf8" });
    assert.equal(syntax.status, 0, source + ": " + (syntax.stderr || syntax.stdout));
  }
});

test("rejects empty system prompts and normalizes package names", () => {
  assert.throws(() => portableAgentFiles({
    name: "test",
    description: "",
    systemPrompt: "  "
  }), /system prompt/i);
  const files = portableAgentFiles({
    name: "Agente Smith / QA",
    description: "",
    systemPrompt: "Prompt"
  });
  const pkg = JSON.parse(files["package.json"] ?? "{}") as { name: string };
  assert.equal(pkg.name, "agente-smith-qa");
});


test("MCP ingests a workspace document and retrieves it with lexical fallback", () => {
  const workspace = mkdtempSync(path.join(tmpdir(), "sr-smith-rag-"));
  try {
    mkdirSync(path.join(workspace, "docs"), { recursive: true });
    writeFileSync(
      path.join(workspace, "docs", "guide.md"),
      "# Vector retrieval\n\nA vector store keeps document embeddings for semantic retrieval. Chunking and source metadata improve grounded answers.\n",
      "utf8"
    );
    const files = portableAgentFiles({
      name: "RAG integration",
      description: "MCP RAG integration test",
      systemPrompt: "You are a test agent."
    });
    writeFileSync(path.join(workspace, "mcp-server.mjs"), files["src/mcp-server.mjs"] ?? "", "utf8");
    const requests = [
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "knowledge.ingest", arguments: { paths: ["docs/guide.md"] } } },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "knowledge.search", arguments: { query: "vector store semantic retrieval" } } },
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "knowledge.stats", arguments: {} } },
      { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "knowledge.ingest", arguments: { paths: ["../outside.txt"] } } }
    ];
    const run = spawnSync(process.execPath, ["mcp-server.mjs"], {
      cwd: workspace,
      input: requests.map((request) => JSON.stringify(request)).join("\n") + "\n",
      encoding: "utf8",
      timeout: 15000,
      env: { ...process.env, SMITH_WORKSPACE: workspace, SMITH_EMBEDDING_PROVIDER: "disabled" }
    });
    assert.equal(run.status, 0, run.stderr || run.stdout);
    const responses = run.stdout.trim().split(/\r?\n/).map((line) => JSON.parse(line));
    const ingest = JSON.parse(responses.find((item) => item.id === 2).result.content[0].text);
    const search = JSON.parse(responses.find((item) => item.id === 3).result.content[0].text);
    const stats = JSON.parse(responses.find((item) => item.id === 4).result.content[0].text);
    const rejected = responses.find((item) => item.id === 5).result;
    assert.equal(ingest.indexedFiles, 1);
    assert.equal(ingest.addedChunks, 1);
    assert.equal(search.mode, "lexical-fallback");
    assert.equal(search.results[0].source, "docs/guide.md");
    assert.equal(stats.documents, 1);
    assert.equal(stats.chunks, 1);
    assert.equal(rejected.isError, true);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
