import { scanUntrusted } from "../../dsh-superagent-xlevel/src/governance/safety/index.ts";
import { providerChat, type AiProviderConfig } from "./ai-provider";

export interface ProjectGenerationInput {
  projectName: string;
  objective: string;
  framework: string;
  ide: string[];
  baseFiles: Record<string, string>;
}

export interface GeneratedProject {
  files: Record<string, string>;
  summary: string;
}

const RESERVED = /(^|\/)(\.env(?:\.|$)|package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|tsconfig\.json|\.gitignore)$/i;
const MAX_FILES = 24;
const MAX_FILE_BYTES = 48_000;
const MAX_TOTAL_BYTES = 240_000;

function safePath(path: string): boolean {
  if (!path || path.length > 180 || path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
  const parts = path.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return false;
  if (RESERVED.test(path) || /(^|\/)node_modules(\/|$)|(^|\/)\.git(\/|$)/i.test(path)) return false;
  return /^[A-Za-z0-9._/-]+$/.test(path);
}

function parsePayload(raw: string): { files: Record<string, unknown>; summary?: string } {
  const cleaned = raw.trim().replace(/^\uFEFF/, "").replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("El modelo no devolvió un objeto JSON de archivos.");
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { files?: unknown; summary?: unknown };
  if (!parsed.files || typeof parsed.files !== "object" || Array.isArray(parsed.files)) {
    throw new Error("La respuesta del modelo no contiene el mapa files.");
  }
  return {
    files: parsed.files as Record<string, unknown>,
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
  };
}

export async function generateProjectFiles(
  config: AiProviderConfig,
  input: ProjectGenerationInput,
  signal?: AbortSignal,
): Promise<GeneratedProject> {
  const baseInventory = Object.keys(input.baseFiles).sort();
  const safeProjectName = scanUntrusted(input.projectName).sanitized;
  const safeObjective = scanUntrusted(input.objective).sanitized;
  const prompt = [
    "Genera una implementación real y ejecutable para este proyecto. No redactes una propuesta: escribe los archivos completos.",
    "Devuelve exclusivamente JSON válido con esta forma: {\"summary\":\"resumen breve\",\"files\":{\"src/archivo.ts\":\"contenido completo\"}}.",
    "Incluye código funcional específico para el objetivo, manejo de errores, persistencia si el objetivo la necesita y pruebas mínimas útiles.",
    "Respeta el framework y las dependencias ya disponibles. No añadas dependencias externas salvo que sean imprescindibles; package.json, lockfiles, tsconfig y .gitignore están reservados y no debes devolverlos.",
    "No generes .env, secretos, claves API, binarios, archivos de node_modules ni rutas fuera del proyecto.",
    "Máximo 24 archivos y 240 KB en total. No incluyas Markdown explicativo como sustituto del código.",
    "Si el proyecto base ya contiene un archivo adecuado, puedes devolver su ruta para reemplazarlo con una implementación completa.",
    "",
    "PROYECTO: " + safeProjectName,
    "FRAMEWORK: " + input.framework,
    "ENTORNOS: " + input.ide.join(", "),
    "OBJETIVO:",
    safeObjective,
    "",
    "ARCHIVOS BASE DISPONIBLES:",
    ...baseInventory.map((path) => "- " + path),
    "",
    "Genera la estructura y los contenidos completos necesarios para que el proyecto cumpla el objetivo.",
  ].join("\n");
  const raw = await providerChat(
    config,
    "Eres un generador de software senior. Devuelve JSON válido, código completo y rutas relativas seguras. No afirmes que has ejecutado código.",
    prompt,
    signal,
  );
  const payload = parsePayload(raw);
  const files: Record<string, string> = {};
  let totalBytes = 0;
  for (const [path, value] of Object.entries(payload.files)) {
    if (!safePath(path) || typeof value !== "string") continue;
    const bytes = new TextEncoder().encode(value).byteLength;
    if (bytes > MAX_FILE_BYTES || totalBytes + bytes > MAX_TOTAL_BYTES) continue;
    files[path] = value;
    totalBytes += bytes;
    if (Object.keys(files).length >= MAX_FILES) break;
  }
  if (Object.keys(files).length === 0) {
    throw new Error("El modelo no devolvió ningún archivo admisible. Revisa el modelo o reduce el objetivo.");
  }
  return { files, summary: payload.summary ?? "Implementación generada por el proveedor seleccionado." };
}
