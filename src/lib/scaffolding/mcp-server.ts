export function mcpServerSource(enabledTools: string[]): string {
  return String.raw`import { createInterface } from "node:readline";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, readdir, realpath, lstat, rename } from "node:fs/promises";
import path from "node:path";
import { stdin, stdout, stderr } from "node:process";

const ROOT = await realpath(process.env.SMITH_WORKSPACE || process.cwd());
const MEMORY_DIR = path.join(ROOT, ".sr-smith");
const MEMORY_FILE = path.join(MEMORY_DIR, "memory.json");
const KNOWLEDGE_FILE = path.join(MEMORY_DIR, "knowledge.json");
try {
  const envText = await readFile(path.join(ROOT, ".env"), "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
const ENABLED = new Set(${JSON.stringify(enabledTools)});
const ALLOW_SHELL = process.env.SMITH_ALLOW_SHELL === "true";
const HIDDEN = new Set([".git", "node_modules", ".sr-smith", ".next", "dist", "build"]);
const MAX_READ = 1_000_000;
const MAX_WRITE = 500_000;

function resolvePath(input) {
  const requested = typeof input === "string" ? input : "";
  if (!requested || requested.includes("\0") || requested.includes("\\") || path.isAbsolute(requested)) throw new Error("Ruta relativa obligatoria.");
  const parts = requested.split(/[\\/]+/);
  if (parts.some((part) => HIDDEN.has(part) || part.startsWith(".env"))) throw new Error("Ruta privada o excluida.");
  const target = path.resolve(ROOT, requested);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) throw new Error("Ruta fuera del workspace.");
  return target;
}

async function ensureInside(target, allowMissing = false) {
  const parent = allowMissing ? path.dirname(target) : target;
  const resolved = await realpath(parent);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) throw new Error("La ruta resuelve fuera del workspace.");
  return resolved;
}

async function listFiles(directory = ROOT, depth = 0, output = []) {
  if (depth > 4 || output.length >= 250) return output;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isSymbolicLink() || HIDDEN.has(entry.name) || entry.name.startsWith(".env")) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await listFiles(absolute, depth + 1, output);
    else if (entry.isFile()) output.push(path.relative(ROOT, absolute).split(path.sep).join("/"));
    if (output.length >= 250) break;
  }
  return output;
}

async function readWorkspace(input) {
  const target = resolvePath(input.path);
  const resolved = await ensureInside(target);
  const info = await lstat(target);
  if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_READ) throw new Error("Archivo no permitido o demasiado grande.");
  return { path: path.relative(ROOT, resolved), content: await readFile(resolved, "utf8") };
}

async function writeWorkspace(input) {
  const target = resolvePath(input.path);
  if (typeof input.content !== "string" || Buffer.byteLength(input.content) > MAX_WRITE) throw new Error("Contenido inválido o superior a 500 KB.");
  await mkdir(path.dirname(target), { recursive: true });
  const parent = await ensureInside(target, true);
  try {
    const info = await lstat(target);
    if (info.isSymbolicLink() || !info.isFile()) throw new Error("No se sobrescriben enlaces ni directorios.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const temp = target + ".sr-smith-" + process.pid + ".tmp";
  await writeFile(temp, input.content, { encoding: "utf8", flag: "wx" });
  await rename(temp, target);
  return { path: path.relative(ROOT, target), bytes: Buffer.byteLength(input.content), written: true };
}

async function loadMemory() {
  try {
    const resolved = await realpath(MEMORY_DIR);
    if (resolved !== MEMORY_DIR) throw new Error("Memory directory must stay inside the workspace.");
    return JSON.parse(await readFile(MEMORY_FILE, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function saveMemory(records) {
  await mkdir(MEMORY_DIR, { recursive: true });
  await ensureInside(MEMORY_DIR);
  const temp = MEMORY_FILE + ".tmp";
  await writeFile(temp, JSON.stringify(records.slice(-500), null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temp, MEMORY_FILE);
}


function tokenize(value) {
  return String(value || "").toLowerCase().split(/[^a-z0-9áéíóúüñ]+/i).filter((term) => term.length > 2);
}
function splitIntoChunks(content, maxChars = 1400, overlap = 180) {
  const text = String(content || "").replace(/\r\n/g, "\n").trim();
  const chunks = [];
  let start = 0;
  while (start < text.length && chunks.length < 1000) {
    let end = Math.min(text.length, start + maxChars);
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf("\n", end), text.lastIndexOf(". ", end), text.lastIndexOf(" ", end));
      if (boundary > start + Math.floor(maxChars * 0.55)) end = boundary + 1;
    }
    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= text.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}
async function loadKnowledge() {
  try {
    const resolved = await realpath(MEMORY_DIR);
    if (resolved !== MEMORY_DIR) throw new Error("Knowledge directory must stay inside the workspace.");
    const data = JSON.parse(await readFile(KNOWLEDGE_FILE, "utf8"));
    return { version: 1, chunks: Array.isArray(data.chunks) ? data.chunks : [] };
  } catch (error) {
    if (error?.code === "ENOENT") return { version: 1, chunks: [] };
    throw error;
  }
}
async function saveKnowledge(index) {
  await mkdir(MEMORY_DIR, { recursive: true });
  await ensureInside(MEMORY_DIR);
  const temp = KNOWLEDGE_FILE + "." + process.pid + ".tmp";
  await writeFile(temp, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), chunks: index.chunks.slice(-5000) }), { encoding: "utf8", mode: 0o600, flag: "w" });
  await rename(temp, KNOWLEDGE_FILE);
}
async function embedTexts(inputs) {
  const provider = String(process.env.SMITH_EMBEDDING_PROVIDER || "ollama").toLowerCase();
  const model = String(process.env.SMITH_EMBEDDING_MODEL || "nomic-embed-text");
  const baseUrl = String(process.env.SMITH_EMBEDDING_BASE_URL || process.env.SMITH_BASE_URL || "http://localhost:11434").replace(/\/$/, "");
  if (!inputs.length || provider === "disabled" || provider === "lexical") return null;
  let endpoint;
  const headers = { "content-type": "application/json" };
  let body;
  if (provider === "ollama") {
    endpoint = baseUrl + "/api/embed";
    body = { model, input: inputs };
  } else if (provider === "openai" || provider === "openai-compatible") {
    endpoint = baseUrl.endsWith("/v1") ? baseUrl + "/embeddings" : baseUrl + "/v1/embeddings";
    if (process.env.SMITH_API_KEY) headers.authorization = "Bearer " + process.env.SMITH_API_KEY;
    body = { model, input: inputs };
  } else {
    return null;
  }
  try {
    const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
    if (!response.ok) return null;
    const data = await response.json();
    const vectors = Array.isArray(data.embeddings) ? data.embeddings : Array.isArray(data.data) ? data.data.map((item) => item.embedding) : [];
    if (vectors.length !== inputs.length || vectors.some((vector) => !Array.isArray(vector) || !vector.length || vector.some((value) => !Number.isFinite(value)))) return null;
    return vectors;
  } catch {
    return null;
  }
}
function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) return -1;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : -1;
}
async function collectKnowledgeFiles(requestedPaths) {
  if (!Array.isArray(requestedPaths) || !requestedPaths.length || requestedPaths.length > 50) throw new Error("paths debe contener entre 1 y 50 rutas relativas.");
  const candidates = [];
  for (const item of requestedPaths) {
    if (typeof item !== "string" || !item.trim()) throw new Error("Cada ruta debe ser un string no vacío.");
    const target = resolvePath(item);
    const resolved = await ensureInside(target);
    const info = await lstat(target);
    if (info.isSymbolicLink()) throw new Error("No se indexan enlaces simbólicos.");
    if (info.isDirectory()) candidates.push(...await listFiles(resolved));
    else if (info.isFile()) candidates.push(path.relative(ROOT, resolved).split(path.sep).join("/"));
    else throw new Error("La ruta no es un archivo o directorio regular.");
  }
  const unique = [...new Set(candidates)].filter((file) => /\.(md|mdx|txt|rst|json|ya?ml|toml|ts|tsx|js|mjs|py|go|rs|java|sql|html|css)$/i.test(file));
  if (!unique.length) throw new Error("No se encontraron archivos de texto compatibles para indexar.");
  if (unique.length > 50) throw new Error("La ingesta está limitada a 50 archivos por operación.");
  return unique;
}
async function ingestKnowledge(args) {
  const files = await collectKnowledgeFiles(args.paths);
  const index = await loadKnowledge();
  const replacements = new Set(files);
  const retained = index.chunks.filter((chunk) => !replacements.has(chunk.source));
  const additions = [];
  let totalBytes = 0;
  let skipped = 0;
  for (const file of files) {
    const target = resolvePath(file);
    const info = await lstat(target);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 500000) {
      skipped += 1;
      continue;
    }
    const content = await readFile(target, "utf8");
    totalBytes += Buffer.byteLength(content);
    if (totalBytes > 2500000) throw new Error("La ingesta supera el límite de 2.5 MB por operación.");
    const hash = createHash("sha256").update(content).digest("hex");
    const existing = index.chunks.find((chunk) => chunk.source === file && chunk.hash === hash);
    if (existing) {
      retained.push(...index.chunks.filter((chunk) => chunk.source === file));
      skipped += 1;
      continue;
    }
    const pieces = splitIntoChunks(content);
    for (let chunkIndex = 0; chunkIndex < pieces.length; chunkIndex += 1) {
      additions.push({ id: hash + ":" + chunkIndex, source: file, hash, chunkIndex, content: pieces[chunkIndex], embedding: null, updatedAt: new Date().toISOString() });
    }
  }
  if (additions.length > 5000) throw new Error("La ingesta produciría más de 5000 fragmentos.");
  let embedded = 0;
  for (let offset = 0; offset < additions.length; offset += 12) {
    const batch = additions.slice(offset, offset + 12);
    const vectors = await embedTexts(batch.map((chunk) => chunk.content));
    if (vectors) {
      batch.forEach((chunk, index) => { chunk.embedding = vectors[index]; });
      embedded += vectors.length;
    }
  }
  const combined = retained.concat(additions).slice(-5000);
  await saveKnowledge({ chunks: combined });
  return {
    indexedFiles: files.length - skipped,
    skippedFiles: skipped,
    addedChunks: additions.length,
    embeddedChunks: embedded,
    lexicalOnlyChunks: additions.length - embedded,
    embeddingProvider: process.env.SMITH_EMBEDDING_PROVIDER || "ollama",
    embeddingModel: process.env.SMITH_EMBEDDING_MODEL || "nomic-embed-text"
  };
}
async function searchKnowledge(args) {
  const query = String(args.query || "").trim();
  if (!query || query.length > 1000) throw new Error("query debe tener entre 1 y 1000 caracteres.");
  const index = await loadKnowledge();
  if (!index.chunks.length) return { indexed: false, message: "No hay conocimiento indexado. Ejecuta knowledge.ingest con rutas del workspace.", results: [] };
  const queryTerms = [...new Set(tokenize(query))];
  const queryVectors = await embedTexts([query]);
  const queryVector = queryVectors && queryVectors[0];
  const scored = index.chunks.map((chunk) => {
    const content = String(chunk.content || "");
    const lower = content.toLowerCase();
    const matched = queryTerms.filter((term) => lower.includes(term)).length;
    const lexical = queryTerms.length ? matched / queryTerms.length : 0;
    const semantic = queryVector && Array.isArray(chunk.embedding) ? cosineSimilarity(queryVector, chunk.embedding) : -1;
    const score = semantic >= 0 ? Math.max(0, semantic) * 0.8 + lexical * 0.2 : lexical;
    return { source: chunk.source, chunk: chunk.chunkIndex, score: Number(score.toFixed(4)), match: semantic >= 0 ? "hybrid" : "lexical", excerpt: content.slice(0, 900) };
  }).filter((item) => item.score > 0);
  const topK = Math.min(Math.max(Number(args.topK) || 6, 1), 12);
  return { indexed: true, mode: queryVector ? "semantic+lexical" : "lexical-fallback", results: scored.sort((a, b) => b.score - a.score).slice(0, topK) };
}
async function knowledgeStats() {
  const index = await loadKnowledge();
  const sources = new Set(index.chunks.map((chunk) => chunk.source));
  return {
    documents: sources.size,
    chunks: index.chunks.length,
    embeddedChunks: index.chunks.filter((chunk) => Array.isArray(chunk.embedding)).length,
    lexicalOnlyChunks: index.chunks.filter((chunk) => !Array.isArray(chunk.embedding)).length,
    embeddingProvider: process.env.SMITH_EMBEDDING_PROVIDER || "ollama",
    embeddingModel: process.env.SMITH_EMBEDDING_MODEL || "nomic-embed-text"
  };
}

const definitions = [
  { name: "shell.exec", description: "Ejecuta un programa permitido con argumentos separados, sin shell; requiere SMITH_ALLOW_SHELL=true.", inputSchema: { type: "object", properties: { program: { type: "string" }, args: { type: "array", items: { type: "string" } }, timeoutMs: { type: "number" } }, required: ["program", "args"] } },
  { name: "workspace.list", description: "Lista archivos del workspace, omitiendo dependencias y carpetas privadas.", inputSchema: { type: "object", properties: { path: { type: "string" } } } },
  { name: "workspace.read", description: "Lee un archivo de texto dentro del workspace.", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
  { name: "workspace.write", description: "Escribe un archivo dentro del workspace con reemplazo atómico.", inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
  { name: "knowledge.ingest", description: "Ingiere archivos de texto del workspace, crea fragmentos y embeddings locales cuando el proveedor está disponible.", inputSchema: { type: "object", properties: { paths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 50 } }, required: ["paths"] } },
  { name: "knowledge.search", description: "Recupera fragmentos mediante similitud vectorial con refuerzo léxico o búsqueda léxica de reserva.", inputSchema: { type: "object", properties: { query: { type: "string" }, topK: { type: "number" } }, required: ["query"] } },
  { name: "knowledge.stats", description: "Muestra documentos, fragmentos y cobertura de embeddings del índice local.", inputSchema: { type: "object", properties: {} } },
  { name: "memory.remember", description: "Guarda una nota persistente del proyecto.", inputSchema: { type: "object", properties: { content: { type: "string" }, source: { type: "string" } }, required: ["content"] } },
  { name: "memory.recall", description: "Recupera notas persistentes relevantes del proyecto.", inputSchema: { type: "object", properties: { query: { type: "string" } } } }
].filter((tool) => ENABLED.has(tool.name) && (tool.name !== "shell.exec" || ALLOW_SHELL));

async function callTool(name, args) {
  if (!ENABLED.has(name)) throw new Error("La herramienta no está habilitada en este agente.");
  if (name === "shell.exec") {
    if (!ALLOW_SHELL) throw new Error("Shell deshabilitado. Activa SMITH_ALLOW_SHELL=true explícitamente en la configuración MCP.");
    const program = String(args.program || "");
    const allowed = new Set(["node", "npm", "npx", "git", "python3", "python", "pytest", "tsc", "vite", "eslint"]);
    if (!allowed.has(program)) throw new Error("Programa no permitido: " + program);
    const argv = Array.isArray(args.args) ? args.args : null;
    if (!argv || argv.length > 100 || argv.some((item) => typeof item !== "string" || item.length > 2000)) throw new Error("args debe ser un array de hasta 100 strings.");
    if (program === "git" && (["push", "reset", "clean", "rebase", "checkout", "restore"].includes(argv[0]) || argv.some((item) => item === "-C" || item.startsWith("--git-dir") || item.startsWith("--work-tree")))) throw new Error("Operación Git bloqueada por seguridad.");
    if (program === "npm" && ["exec", "publish", "unpublish"].includes(argv[0])) throw new Error("Subcomando npm bloqueado por seguridad.");
    if (program === "node" || program === "python" || program === "python3") {
      if (!argv[0] || argv[0].startsWith("-") || path.isAbsolute(argv[0])) throw new Error("El intérprete solo puede ejecutar un script relativo del workspace.");
      const scriptPath = resolvePath(argv[0]);
      await ensureInside(scriptPath);
      argv[0] = path.relative(ROOT, scriptPath);
    }
    const timeout = Math.min(Math.max(Number(args.timeoutMs) || 30000, 1000), 60000);
    return await new Promise((resolve, reject) => {
      const child = spawn(program, argv, { cwd: ROOT, shell: false, windowsHide: true, env: { PATH: process.env.PATH || "", HOME: process.env.HOME || "", USERPROFILE: process.env.USERPROFILE || "", TMPDIR: process.env.TMPDIR || "", TEMP: process.env.TEMP || "", SystemRoot: process.env.SystemRoot || "" } });
      let stdoutText = "";
      let stderrText = "";
      let outputBytes = 0;
      const timer = setTimeout(() => child.kill("SIGTERM"), timeout);
      child.stdout.on("data", (chunk) => { outputBytes += chunk.length; if (outputBytes <= 100000) stdoutText += chunk.toString("utf8"); else child.kill("SIGTERM"); });
      child.stderr.on("data", (chunk) => { outputBytes += chunk.length; if (outputBytes <= 100000) stderrText += chunk.toString("utf8"); else child.kill("SIGTERM"); });
      child.on("error", (error) => { clearTimeout(timer); reject(error); });
      child.on("close", (code, signal) => { clearTimeout(timer); resolve({ program, args: argv, exitCode: code, signal, stdout: stdoutText, stderr: stderrText, truncated: outputBytes > 100000 }); });
    });
  }
  if (name === "workspace.list") {
    const base = args.path ? resolvePath(args.path) : ROOT;
    await ensureInside(base);
    return (await listFiles(base)).map((file) => file);
  }
  if (name === "workspace.read") return readWorkspace(args);
  if (name === "workspace.write") return writeWorkspace(args);
  if (name === "knowledge.ingest") return ingestKnowledge(args);
  if (name === "knowledge.search") return searchKnowledge(args);
  if (name === "knowledge.stats") return knowledgeStats();
  if (name === "memory.remember") {
    const content = String(args.content || "").trim();
    if (!content || content.length > 4000) throw new Error("La nota debe tener entre 1 y 4000 caracteres.");
    const records = await loadMemory();
    const record = { id: Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8), content, source: String(args.source || "agent"), createdAt: new Date().toISOString() };
    records.push(record);
    await saveMemory(records);
    return record;
  }
  if (name === "memory.recall") {
    const query = String(args.query || "").toLowerCase();
    const records = await loadMemory();
    return records.filter((record) => !query || record.content.toLowerCase().includes(query)).slice(-20).reverse();
  }
  throw new Error("Herramienta desconocida: " + name);
}

async function handle(message) {
  const { id, method, params = {} } = message;
  if (method === "notifications/initialized") return null;
  if (method === "initialize") {
    return { jsonrpc: "2.0", id, result: { protocolVersion: params.protocolVersion || "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "sr-smith-workspace", version: "1.0.0" } } };
  }
  if (method === "ping") return { jsonrpc: "2.0", id, result: {} };
  if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: definitions } };
  if (method === "tools/call") {
    try {
      const result = await callTool(String(params.name || ""), params.arguments && typeof params.arguments === "object" ? params.arguments : {});
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }], isError: false } };
    } catch (error) {
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }], isError: true } };
    }
  }
  return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found: " + method } };
}

const input = createInterface({ input: stdin, crlfDelay: Infinity });
for await (const line of input) {
  if (!line.trim()) continue;
  try {
    const message = JSON.parse(line);
    const response = await handle(message);
    if (response) stdout.write(JSON.stringify(response) + "\n");
  } catch (error) {
    stderr.write("Sr. Smith MCP: " + (error instanceof Error ? error.message : String(error)) + "\n");
  }
}`;
}
