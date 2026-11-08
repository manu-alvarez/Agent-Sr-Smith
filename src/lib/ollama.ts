export const DEFAULT_OLLAMA_HOST = "http://100.100.2.10:11434";

export interface OllamaModel {
  name: string;
  size: number;
}

export function ollamaOrigin(host: string): string {
  const trimmed = host.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("La dirección tiene que empezar por http:// o https://");
  }
  return trimmed;
}

export function parseOllamaTags(body: unknown): OllamaModel[] {
  const models = (body as { models?: Array<{ name?: string; size?: number }> } | null)?.models ?? [];
  return models
    .filter((item) => typeof item.name === "string" && item.name.length > 0)
    .map((item) => ({ name: item.name as string, size: item.size ?? 0 }));
}

export function preferModel(models: OllamaModel[]): string {
  const chat = models.filter((item) => !item.name.startsWith("nomic-embed"));
  return chat.find((item) => item.name === "gemma4:latest")?.name ?? [...chat].sort((a, b) => b.size - a.size)[0]?.name ?? "";
}

async function fetchOllama(host: string, path: string, init?: RequestInit): Promise<Response> {
  if (typeof window !== "undefined") {
    try {
      const proxied = await fetch(`/ollama-proxy${path}`, init);
      if ((proxied.headers.get("content-type") ?? "").includes("json")) return proxied;
    } catch {
      // El proxy solo existe en el servidor de desarrollo. Fuera de él se llama a Ollama directo.
    }
  }
  return fetch(`${ollamaOrigin(host)}${path}`, init);
}

export async function listOllamaModels(host: string, signal?: AbortSignal): Promise<OllamaModel[]> {
  const response = await fetchOllama(host, "/api/tags", { signal });
  if (!response.ok) throw new Error(`Ollama respondió ${response.status}.`);
  return parseOllamaTags(await response.json());
}

export async function ollamaChat(host: string, model: string, system: string, user: string, signal?: AbortSignal): Promise<string> {
  const response = await fetchOllama(host, "/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal,
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Ollama respondió ${response.status}.`);
  const body = (await response.json()) as { message?: { content?: string; thinking?: string } };
  const content = body.message?.content?.trim() || body.message?.thinking?.trim();
  if (!content) throw new Error("El modelo no devolvió texto.");
  return content;
}

export const OLLAMA_SYSTEM =
  "Eres el redactor técnico de Sr.Smith. Amplía el encargo al nivel de un equipo senior: arquitectura, archivos concretos, contratos, pruebas, riesgos y el orden de trabajo. Escribe en español, listo para copiar a un repositorio. No inventes credenciales ni afirmes haber ejecutado herramientas.";
