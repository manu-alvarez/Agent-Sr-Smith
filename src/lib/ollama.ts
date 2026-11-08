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

export async function listOllamaModels(host: string, signal?: AbortSignal): Promise<OllamaModel[]> {
  const response = await fetch(`${ollamaOrigin(host)}/api/tags`, { signal });
  if (!response.ok) throw new Error(`Ollama respondió ${response.status}.`);
  return parseOllamaTags(await response.json());
}

export async function ollamaChat(host: string, model: string, system: string, user: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${ollamaOrigin(host)}/api/chat`, {
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
  const body = (await response.json()) as { message?: { content?: string } };
  const content = body.message?.content?.trim();
  if (!content) throw new Error("El modelo no devolvió texto.");
  return content;
}

export const OLLAMA_SYSTEM =
  "Eres el redactor técnico de Sr.Smith. Amplía el encargo al nivel de un equipo senior: arquitectura, archivos concretos, contratos, pruebas, riesgos y el orden de trabajo. Escribe en español, listo para copiar a un repositorio. No inventes credenciales ni afirmes haber ejecutado herramientas.";
