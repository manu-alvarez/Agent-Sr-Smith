import { mcpServerSource } from "./mcp-server.ts";

export interface PortableAgentOptions {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  provider?: string;
  baseUrl?: string;
  enabledTools?: string[];
}

function safeName(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64) || "sr-smith-agent";
}

/**
 * Generates a portable LLM conversation runtime and a separate workspace-scoped
 * MCP server. Only selected MCP adapters are executable; shell and browser tools
 * remain declarative until their adapters are implemented.
 */
export function portableAgentFiles(options: PortableAgentOptions): Record<string, string> {
  const name = safeName(options.name);
  const model = options.model?.trim() || "gemma4:latest";
  const baseSystem = options.systemPrompt.trim();
  if (!baseSystem) throw new Error("A non-empty system prompt is required.");
  const system = baseSystem + "\n\n## Límites del runtime exportado\nEste paquete incluye conversación LLM, orquestación multirol bajo demanda y un servidor MCP local. Usa /orchestrate para dividir una meta en tareas delegadas con concurrencia limitada y síntesis final. El conocimiento local requiere ejecutar knowledge.ingest; usa embeddings Ollama u OpenAI-compatible cuando estén configurados y búsqueda léxica cuando no lo estén. No afirmes acciones sin resultado de herramienta. Shell está desactivado por defecto y requiere SMITH_ALLOW_SHELL=true. No incluye navegador ni MCP remoto.";

  const selectedTools = options.enabledTools ?? ["workspace.list", "workspace.read", "workspace.write", "knowledge.search", "memory.remember", "memory.recall"];
  const enabledTools = Array.from(new Set([...selectedTools, ...(selectedTools.includes("knowledge.search") ? ["knowledge.ingest", "knowledge.stats"] : [])]));

  const packageJson = {
    name: name.toLowerCase(),
    version: "1.0.0",
    private: true,
    description: options.description.trim() || "Portable AI agent generated with Sr. Smith",
    type: "module",
    engines: { node: ">=22" },
    scripts: { start: "node src/index.mjs", doctor: "node src/doctor.mjs", mcp: "node src/mcp-server.mjs" }
  };

  const runtime = String.raw`import { createInterface } from "node:readline/promises";
import { orchestrateGoal } from "./orchestrator.mjs";
import { readFileSync } from "node:fs";
import { stdin, stdout } from "node:process";

try {
  const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
    process.env[match[1]] = value;
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const provider = (process.env.SMITH_PROVIDER || ${JSON.stringify(options.provider ?? "ollama")}).toLowerCase();
const baseUrl = (process.env.SMITH_BASE_URL || ${JSON.stringify(options.baseUrl || "http://localhost:11434")}).replace(/\/$/, "");
const model = process.env.SMITH_MODEL || ${JSON.stringify(model)};
const apiKey = process.env.SMITH_API_KEY || "";
const systemPrompt = ${JSON.stringify(system)};

async function complete(messages) {
  let url;
  let headers = { "content-type": "application/json" };
  let body;

  if (provider === "ollama") {
    url = baseUrl + "/api/chat";
    body = { model, messages, stream: false, options: { num_predict: 16384 } };
  } else if (provider === "anthropic") {
    url = baseUrl + "/messages";
    headers = { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
    const dynamicSystem = messages.find((message) => message.role === "system")?.content || systemPrompt;
    body = { model, max_tokens: 8192, system: dynamicSystem, messages: messages.filter((message) => message.role !== "system") };
  } else if (provider === "google") {
    url = baseUrl + "/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);
    body = { systemInstruction: { parts: [{ text: messages.find((message) => message.role === "system")?.content || systemPrompt }] }, contents: messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })), generationConfig: { maxOutputTokens: 16384 } };
  } else if (["openai-compatible", "openai", "openrouter", "nvidia"].includes(provider)) {
    url = baseUrl + "/chat/completions";
    if (apiKey) headers.authorization = "Bearer " + apiKey;
    body = { model, max_tokens: 16384, messages, stream: false };
  } else {
    throw new Error("Unsupported provider: " + provider);
  }

  if (provider !== "ollama" && !apiKey) throw new Error("SMITH_API_KEY is required for this provider.");
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error("Provider returned HTTP " + response.status + ": " + detail.slice(0, 500));
  }

  const data = await response.json();
  const content = provider === "ollama"
    ? data.message?.content
    : provider === "anthropic"
      ? data.content?.map((part) => part.text ?? "").join("")
      : provider === "google"
        ? data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("")
        : data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Provider returned an empty or unsupported response.");
  }
  return content;
}

const messages = [{ role: "system", content: systemPrompt }];
const rl = createInterface({ input: stdin, output: stdout });
console.log(" ${name} · provider=" + provider + " · model=" + model);
console.log("Comandos: /orchestrate <meta> · /exit. La orquestación delega tareas LLM y utiliza el índice RAG local si existe.");
try {
  while (true) {
    const input = (await rl.question("\nTú> ")).trim();
    if (!input) continue;
    if (input === "/exit" || input === "/quit") break;
    if (input.startsWith("/orchestrate ")) {
      try {
        const report = await orchestrateGoal({ goal: input.slice("/orchestrate ".length), complete, maxParallel: process.env.SMITH_MAX_PARALLEL || 3 });
        console.log("\n" + report);
      } catch (error) {
        console.error("\nError de orquestación: " + (error instanceof Error ? error.message : String(error)));
      }
      continue;
    }
    messages.push({ role: "user", content: input });
    try {
      const answer = await complete(messages);
      messages.push({ role: "assistant", content: answer });
      if (messages.length > 21) messages.splice(1, messages.length - 21);
      console.log("\nAgente> " + answer);
    } catch (error) {
      messages.pop();
      console.error("\nError: " + (error instanceof Error ? error.message : String(error)));
    }
  }
} finally {
  rl.close();
}`;

  const doctor = String.raw`import { readFileSync } from "node:fs";
try {
  const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
const provider = (process.env.SMITH_PROVIDER || ${JSON.stringify(options.provider ?? "ollama")}).toLowerCase();
const baseUrl = (process.env.SMITH_BASE_URL || ${JSON.stringify(options.baseUrl || "http://localhost:11434")}).replace(/\/$/, "");
const model = process.env.SMITH_MODEL || ${JSON.stringify(model)};
const apiKey = process.env.SMITH_API_KEY || "";
const endpoint = provider === "ollama" ? baseUrl + "/api/tags" : provider === "google" ? baseUrl + "/models?key=" + encodeURIComponent(apiKey) : baseUrl + "/models";
const doctorHeaders = provider === "anthropic" ? { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } : provider === "google" ? {} : apiKey ? { authorization: "Bearer " + apiKey } : {};
try {
  if (provider !== "ollama" && !apiKey) throw new Error("SMITH_API_KEY is required for this provider.");
  const response = await fetch(endpoint, { headers: doctorHeaders, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("HTTP " + response.status);
  console.log(JSON.stringify({ ok: true, provider, model, endpoint }, null, 2));
} catch (error) {
  console.error("Provider unavailable:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}`;

const orchestratorRuntime = String.raw`import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const KNOWLEDGE_FILE = path.join(ROOT, ".sr-smith", "knowledge.json");
const ROLE_GUIDANCE = {
  analyst: "Analiza el problema, delimita requisitos, supuestos, riesgos y criterios verificables. No implementes.",
  researcher: "Investiga el objetivo usando solo el contexto recuperado y razonamiento explícito. Separa hechos, inferencias y dudas.",
  architect: "Diseña una solución mantenible y segura. Expón componentes, contratos, dependencias y decisiones.",
  implementer: "Propón un plan de implementación concreto, incremental y verificable. No afirmes que has ejecutado acciones.",
  reviewer: "Busca omisiones, inconsistencias, riesgos de seguridad y criterios no cubiertos. Sé crítico y específico."
};

function terms(value) {
  return [...new Set(String(value || "").toLowerCase().split(/[^a-z0-9áéíóúüñ]+/i).filter((item) => item.length > 2))];
}

function cosine(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) return -1;
  let dot = 0;
  let a = 0;
  let b = 0;
  for (let i = 0; i < left.length; i += 1) {
    dot += left[i] * right[i];
    a += left[i] * left[i];
    b += right[i] * right[i];
  }
  return a && b ? dot / Math.sqrt(a * b) : -1;
}

async function embedQuery(query) {
  const provider = String(process.env.SMITH_EMBEDDING_PROVIDER || "ollama").toLowerCase();
  const model = String(process.env.SMITH_EMBEDDING_MODEL || "nomic-embed-text");
  const base = String(process.env.SMITH_EMBEDDING_BASE_URL || process.env.SMITH_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
  if (provider === "disabled" || provider === "lexical") return null;
  let url;
  const headers = { "content-type": "application/json" };
  let body;
  if (provider === "ollama") {
    url = base + "/api/embed";
    body = { model, input: query };
  } else if (provider === "openai" || provider === "openai-compatible") {
    url = base.endsWith("/v1") ? base + "/embeddings" : base + "/v1/embeddings";
    if (process.env.SMITH_API_KEY) headers.authorization = "Bearer " + process.env.SMITH_API_KEY;
    body = { model, input: query };
  } else return null;
  try {
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    if (!response.ok) return null;
    const data = await response.json();
    const vector = Array.isArray(data.embeddings) ? data.embeddings[0] : data.data?.[0]?.embedding;
    return Array.isArray(vector) && vector.every(Number.isFinite) ? vector : null;
  } catch {
    return null;
  }
}

async function retrieveKnowledge(query, limit = 5) {
  try {
    const index = JSON.parse(await readFile(KNOWLEDGE_FILE, "utf8"));
    const chunks = Array.isArray(index.chunks) ? index.chunks : [];
    if (!chunks.length) return [];
    const queryTerms = terms(query);
    const vector = await embedQuery(query);
    return chunks.map((chunk) => {
      const text = String(chunk.content || "");
      const lower = text.toLowerCase();
      const lexical = queryTerms.length ? queryTerms.filter((term) => lower.includes(term)).length / queryTerms.length : 0;
      const semantic = vector ? cosine(vector, chunk.embedding) : -1;
      const score = semantic >= 0 ? Math.max(0, semantic) * 0.8 + lexical * 0.2 : lexical;
      return { source: chunk.source, score, text };
    }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function parsePlan(raw) {
  try {
    const match = String(raw).match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const normalized = tasks.slice(0, 5).map((item) => {
      const value = item && typeof item === "object" ? item : {};
      return {
        role: Object.hasOwn(ROLE_GUIDANCE, value.role) ? value.role : "analyst",
        title: String(value.title || value.task || "Tarea delegada").trim().slice(0, 120),
        task: String(value.task || value.title || "").trim().slice(0, 1600)
      };
    }).filter((item) => item.task.length > 10);
    if (normalized.length >= 2) return normalized;
  } catch {
    // A malformed planner response falls back to a fixed, bounded role plan.
  }
  return [
    { role: "analyst", title: "Análisis del objetivo", task: "Descompón el objetivo en requisitos, restricciones, riesgos y criterios de éxito." },
    { role: "architect", title: "Diseño de solución", task: "Propón una arquitectura y un plan de implementación coherente con el objetivo y las restricciones." },
    { role: "reviewer", title: "Revisión crítica", task: "Identifica huecos, fallos potenciales y criterios de aceptación que deben verificarse." }
  ];
}

async function runBounded(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function consume() {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      results[current] = await worker(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => consume()));
  return results;
}

export async function orchestrateGoal({ goal, complete, maxParallel = 3 }) {
  const objective = String(goal || "").trim();
  if (!objective || objective.length > 12000) throw new Error("La meta debe tener entre 1 y 12000 caracteres.");
  if (typeof complete !== "function") throw new Error("No hay proveedor LLM disponible para delegar tareas.");
  const concurrency = Math.min(Math.max(Number(maxParallel) || 3, 1), 4);
  const sharedContext = await retrieveKnowledge(objective, 6);
  const contextText = sharedContext.map((item, index) => "[" + (index + 1) + "] " + item.source + "\n" + item.text.slice(0, 1600)).join("\n\n");
  const planner = await complete([
    { role: "system", content: "Eres el planificador de una orquestación multiagente. Devuelve exclusivamente JSON válido con la forma {\"tasks\":[{\"role\":\"analyst|researcher|architect|implementer|reviewer\",\"title\":\"...\",\"task\":\"...\"}]}. Define entre 2 y 5 tareas independientes que puedan ejecutarse en paralelo. No inventes herramientas ni afirmes ejecuciones." },
    { role: "user", content: "Objetivo:\n" + objective + "\n\nContexto recuperado:\n" + (contextText || "Sin documentos indexados.") }
  ]);
  const tasks = parsePlan(planner);
  const delegated = await runBounded(tasks, concurrency, async (task, index) => {
    const context = await retrieveKnowledge(objective + " " + task.task, 4);
    const evidence = context.map((item) => item.source + "\n" + item.text.slice(0, 1200)).join("\n\n");
    const answer = await complete([
      { role: "system", content: "Actúas como agente delegado con rol " + task.role + ". " + ROLE_GUIDANCE[task.role] + " Devuelve hallazgos concretos, límites y dudas. No afirmes que has ejecutado tareas o herramientas." },
      { role: "user", content: "Objetivo global:\n" + objective + "\n\nTu tarea:\n" + task.task + "\n\nDocumentos recuperados:\n" + (evidence || "No hay pasajes locales relevantes.") }
    ]);
    return { id: index + 1, role: task.role, title: task.title, task: task.task, result: String(answer).slice(0, 10000) };
  });
  const synthesis = await complete([
    { role: "system", content: "Eres el coordinador final. Consolida resultados de agentes delegados. Distingue acuerdos, contradicciones, riesgos y decisiones. No declares verificado lo que solo se ha propuesto. Termina con próximos pasos y criterios de aceptación." },
    { role: "user", content: "Objetivo:\n" + objective + "\n\nResultados delegados:\n" + delegated.map((item) => "## " + item.id + ". " + item.role + " — " + item.title + "\n" + item.result).join("\n\n") }
  ]);
  const report = {
    id: Date.now().toString(36),
    createdAt: new Date().toISOString(),
    goal: objective,
    maxParallel: concurrency,
    knowledgeContext: sharedContext.map((item) => ({ source: item.source, score: item.score })),
    tasks: delegated,
    synthesis
  };
  try {
    const directory = path.join(ROOT, ".sr-smith", "orchestrations");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "latest.json"), JSON.stringify(report, null, 2), { encoding: "utf8", mode: 0o600 });
  } catch (error) {
    console.error("No se pudo persistir el informe de orquestación:", error instanceof Error ? error.message : String(error));
  }
  return [
    "## Orquestación completada",
    "",
    "Tareas delegadas: " + delegated.length + " · concurrencia máxima: " + concurrency,
    "",
    delegated.map((item) => "- **" + item.role + " — " + item.title + "**").join("\n"),
    "",
    "## Síntesis",
    "",
    String(synthesis)
  ].join("\n");
}
`;

  return {
    "AGENTE.md": system + "\n",
    "AGENTS.md": system + "\n",
    "CLAUDE.md": system + "\n",
    "GEMINI.md": system + "\n",
    ".cursor/rules/sr-smith.mdc": "---\ndescription: Sr. Smith agent instructions\nalwaysApply: true\n---\n\n" + system + "\n",
    ".opencode/agents/sr-smith.md": "---\ndescription: Sr. Smith portable agent\nmode: primary\nmodel: " + model + "\n---\n\n" + system + "\n",
    ".mcp.json": JSON.stringify({ mcpServers: { "sr-smith": { command: "node", args: ["src/mcp-server.mjs"], env: { SMITH_ALLOW_SHELL: "false" } } } }, null, 2) + "\n",
    ".cursor/mcp.json": JSON.stringify({ mcpServers: { "sr-smith": { command: "node", args: ["src/mcp-server.mjs"], env: { SMITH_ALLOW_SHELL: "false" } } } }, null, 2) + "\n",
    "opencode.json": JSON.stringify({ mcp: { "sr-smith": { type: "local", command: ["node", "src/mcp-server.mjs"], enabled: true, environment: { SMITH_ALLOW_SHELL: "false" } } } }, null, 2) + "\n",
    "package.json": JSON.stringify(packageJson, null, 2) + "\n",
    ".env.example": [
      `SMITH_PROVIDER=${options.provider ?? "ollama"}`,
      `SMITH_BASE_URL=${options.baseUrl || "http://localhost:11434"}`,
      `SMITH_MODEL=${model}`,
      "SMITH_API_KEY=",
      "SMITH_EMBEDDING_PROVIDER=ollama",
      "SMITH_EMBEDDING_MODEL=nomic-embed-text",
      "SMITH_EMBEDDING_BASE_URL=",
      "SMITH_MAX_PARALLEL=3"
    ].join("\n") + "\n",
    ".gitignore": "node_modules/\n.env\n.sr-smith/\n.DS_Store\n",
    "src/index.mjs": runtime + "\n",
    "src/orchestrator.mjs": orchestratorRuntime + "\n",
    "src/doctor.mjs": doctor + "\n",
    "src/mcp-server.mjs": mcpServerSource(enabledTools),
    "mcp.json": JSON.stringify({
      mcpServers: {
        "sr-smith": { command: "node", args: ["src/mcp-server.mjs"], env: { SMITH_ALLOW_SHELL: "false" } }
      }
    }, null, 2) + "\n",
    "MCP-CONFIG.md": [
      "# Conectar Sr. Smith por MCP",
      "",
      "El servidor expone únicamente las herramientas seleccionadas y se ejecuta en stdio.",
      "Shell está desactivado por defecto. Solo actívalo con SMITH_ALLOW_SHELL=true si confías en el agente. Se ejecuta sin shell, con programas permitidos, timeout y límites de salida, pero hereda los permisos del usuario y no es un sandbox del sistema operativo.",
      "",
      "## Claude Code",
      "",
      "`claude mcp add --transport stdio sr-smith -- node src/mcp-server.mjs`",
      "",
      "## Cursor",
      "",
      "Copia mcp.json a .cursor/mcp.json y reinicia Cursor.",
      "",
      "## OpenCode",
      "",
      "Añade un servidor local en opencode.json con command [node, src/mcp-server.mjs] y enabled true.",
      "",
      "## Codex CLI",
      "",
      "`codex mcp add sr-smith -- node src/mcp-server.mjs`",
      "",
      "Ejecuta el comando desde la raíz del proyecto. El servidor limita las operaciones al workspace y bloquea .env, .git, node_modules y enlaces simbólicos.",
    ].join("\n") + "\n",
    "config/provider.json": JSON.stringify({
      provider: options.provider ?? "ollama",
      baseUrl: options.baseUrl || "http://localhost:11434",
      model,
      supportedProviders: ["ollama", "openai-compatible", "openai", "openrouter", "nvidia", "anthropic", "google"],
      credentials: "environment-only"
    }, null, 2) + "\n",
    "README-RUNTIME.md": [
      "# " + options.name,
      "",
      options.description,
      "",
      "## Requisitos",
      "",
      "- Node.js 22 o superior.",
      "- Acceso al proveedor/modelo configurado.",
      "",
      "## Inicio",
      "",
      "1. Copia .env.example a .env.",
      "2. Ajusta proveedor, URL y modelo.",
      "3. Ejecuta npm start.",
      "4. Comprueba la conexión con npm run doctor.",
      "5. Conecta mcp.json en tu IDE para habilitar las herramientas locales implementadas.",
      "",
      "## Proveedores",
      "",
      "- Ollama: SMITH_PROVIDER=ollama.",
      "- OpenAI, OpenRouter y NVIDIA: API compatible con /chat/completions.",
      "- Anthropic Claude: API nativa /messages.",
      "- Google Gemini: API nativa generateContent.",
      "- MCP local: npm run mcp (workspace, ingesta RAG, búsqueda híbrida/ léxica y memory persistente).",
      "- Orquestación: escribe /orchestrate <meta> para delegar tareas a roles LLM y sintetizar resultados.",
      "- RAG: conecta embeddings Ollama (por defecto nomic-embed-text) o OpenAI-compatible y ejecuta knowledge.ingest con rutas relativas.",
      "- Ollama: instala el modelo local de embeddings con ollama pull nomic-embed-text; usa SMITH_EMBEDDING_PROVIDER=disabled para forzar solo búsqueda léxica.",
      "",
      "La clave API se lee exclusivamente desde el entorno. No la incluyas en el ZIP ni en el repositorio. El índice y las memorias de .sr-smith/ son datos locales y están excluidos de Git por .gitignore.",
      "",
      "## Alcance real",
      "",
      "El runtime conversacional soporta Ollama, OpenAI-compatible, OpenAI, OpenRouter, NVIDIA, Anthropic y Google Gemini. /orchestrate realiza planificación LLM, delegación multirol con concurrencia limitada, recuperación contextual desde el índice y síntesis; guarda el último informe en .sr-smith/orchestrations/latest.json. El servidor MCP local implementa workspace, knowledge.ingest, knowledge.search, knowledge.stats y memory persistente. RAG usa embeddings Ollama u OpenAI-compatible y cae a recuperación léxica si no hay modelo de embeddings disponible. shell.exec es opcional mediante SMITH_ALLOW_SHELL=true y lista permitida. Navegador y MCP remoto siguen sin adaptador ejecutable.",
    ].join("\n") + "\n",
  };
}
