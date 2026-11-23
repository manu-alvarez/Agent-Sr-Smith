export type AiProviderId = "ollama" | "openai" | "openrouter" | "nvidia" | "openai-compatible" | "anthropic" | "google";

export interface AiProviderConfig {
  provider: AiProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const PROVIDERS: Array<{ id: AiProviderId; label: string; baseUrl: string; keyRequired: boolean }> = [
  { id: "ollama", label: "Ollama local", baseUrl: "http://localhost:11434", keyRequired: false },
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", keyRequired: true },
  { id: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", keyRequired: true },
  { id: "nvidia", label: "NVIDIA NIM", baseUrl: "https://integrate.api.nvidia.com/v1", keyRequired: true },
  { id: "anthropic", label: "Anthropic Claude", baseUrl: "https://api.anthropic.com/v1", keyRequired: true },
  { id: "google", label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", keyRequired: true },
  { id: "openai-compatible", label: "OpenAI compatible", baseUrl: "", keyRequired: true },
];

export const AI_PROVIDER_STORAGE_KEY = "sr-smith-ai-provider";

export function storedProviderConfig(): AiProviderConfig {
  const fallback = defaultProviderConfig();
  if (typeof localStorage === "undefined") return fallback;
  try {
    const saved = JSON.parse(localStorage.getItem(AI_PROVIDER_STORAGE_KEY) ?? "{}") as Partial<AiProviderConfig>;
    const provider = PROVIDERS.some((item) => item.id === saved.provider) ? saved.provider! : fallback.provider;
    const preset = PROVIDERS.find((item) => item.id === provider)!;
    return { ...fallback, provider, baseUrl: typeof saved.baseUrl === "string" ? saved.baseUrl : preset.baseUrl, model: typeof saved.model === "string" ? saved.model : "", apiKey: "" };
  } catch { return fallback; }
}

export function defaultProviderConfig(): AiProviderConfig {
  return { provider: "ollama", baseUrl: "http://localhost:11434", apiKey: "", model: "" };
}

function endpoint(baseUrl: string, path: string): string {
  const base = baseUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) throw new Error("La URL del proveedor debe comenzar por http:// o https://");
  return base + path;
}

function headers(config: AiProviderConfig): HeadersInit {
  if (config.provider === "anthropic") {
    return { "content-type": "application/json", "x-api-key": config.apiKey, "anthropic-version": "2023-06-01" };
  }
  if (config.provider === "google") return { "content-type": "application/json" };
  return {
    "content-type": "application/json",
    ...(config.apiKey ? { authorization: "Bearer " + config.apiKey } : {}),
  };
}

async function providerFetch(config: AiProviderConfig, path: string, init?: RequestInit): Promise<Response> {
  if (config.provider === "ollama" && typeof window !== "undefined") {
    try {
      const proxied = await fetch("/ollama-proxy" + path, {
        ...init,
        headers: { ...(init?.headers as Record<string, string> | undefined), "x-smith-ollama-host": config.baseUrl },
      });
      if (proxied.status !== 404 && (proxied.headers.get("content-type") ?? "").includes("json")) return proxied;
    } catch {
      // Production and non-proxy environments fall back to direct browser access.
    }
  }
  return fetch(endpoint(config.baseUrl, path), init);
}
export async function discoverProviderModels(config: AiProviderConfig, signal?: AbortSignal): Promise<string[]> {
  if (config.provider === "ollama") {
    const response = await providerFetch(config, "/api/tags", { signal });
    if (!response.ok) throw new Error("Ollama respondió " + response.status);
    const body = await response.json() as { models?: Array<{ name?: string }> };
    return (body.models ?? []).flatMap((item) => typeof item.name === "string" ? [item.name] : []);
  }
  if (!config.apiKey.trim()) throw new Error("Introduce la API key para consultar los modelos.");
  let url: string;
  if (config.provider === "google") url = endpoint(config.baseUrl, "/models?key=" + encodeURIComponent(config.apiKey));
  else url = endpoint(config.baseUrl, "/models");
  let response: Response;
  if (config.provider !== "openai-compatible") {
    response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider: config.provider, action: "models", apiKey: config.apiKey }), signal });
    if (!(response.headers.get("content-type") ?? "").includes("json")) response = await fetch(url, { headers: headers(config), signal });
  } else {
    response = await fetch(url, { headers: headers(config), signal });
  }
  if (!response.ok) throw new Error("El proveedor respondió " + response.status + " al consultar modelos.");
  const body = await response.json() as { data?: Array<{ id?: string }>; models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> };
  if (config.provider === "google") {
    return (body.models ?? []).filter((item) => item.supportedGenerationMethods?.includes("generateContent"))
      .flatMap((item) => typeof item.name === "string" ? [item.name.replace(/^models\//, "")] : []);
  }
  return (body.data ?? []).flatMap((item) => typeof item.id === "string" ? [item.id] : []);
}

export async function providerChat(
  config: AiProviderConfig,
  system: string,
  user: string,
  signal?: AbortSignal,
): Promise<string> {
  signal ??= AbortSignal.timeout(120_000);
  if (!config.model.trim()) throw new Error("Selecciona un modelo.");
  if (config.provider !== "ollama" && !config.apiKey.trim()) throw new Error("Falta la API key del proveedor.");
  let url: string;
  let body: unknown;
  const requestHeaders: HeadersInit = headers(config);

  if (config.provider === "ollama") {
    url = endpoint(config.baseUrl, "/api/chat");
    body = { model: config.model, stream: false, options: { num_predict: 16384 }, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
  } else if (config.provider === "anthropic") {
    url = endpoint(config.baseUrl, "/messages");
    body = { model: config.model, max_tokens: 8192, system, messages: [{ role: "user", content: user }] };
  } else if (config.provider === "google") {
    url = endpoint(config.baseUrl, "/models/" + encodeURIComponent(config.model) + ":generateContent?key=" + encodeURIComponent(config.apiKey));
    body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { maxOutputTokens: 16384 } };
  } else {
    url = endpoint(config.baseUrl, "/chat/completions");
    body = { model: config.model, max_tokens: 16384, stream: false, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
  }

  let response: Response;
  if (config.provider === "ollama") {
    response = await providerFetch(config, "/api/chat", { method: "POST", headers: requestHeaders, body: JSON.stringify(body), signal });
  } else if (config.provider !== "openai-compatible") {
    response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ provider: config.provider, action: "chat", apiKey: config.apiKey, model: config.model, system, user }), signal });
    if (!(response.headers.get("content-type") ?? "").includes("json")) response = await fetch(url, { method: "POST", headers: requestHeaders, body: JSON.stringify(body), signal });
  } else {
    response = await fetch(url, { method: "POST", headers: requestHeaders, body: JSON.stringify(body), signal });
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(config.provider + " respondió HTTP " + response.status + (detail ? ": " + detail.slice(0, 240) : ""));
  }
  const result = await response.json() as {
    message?: { content?: string };
    choices?: Array<{ message?: { content?: string } }>;
    content?: Array<{ type?: string; text?: string }>;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const answer = config.provider === "ollama"
    ? result.message?.content
    : config.provider === "anthropic"
      ? result.content?.filter((part) => part.type === "text").map((part) => part.text ?? "").join("")
      : config.provider === "google"
        ? result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("")
        : result.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new Error("El proveedor no devolvió contenido de texto.");
  return answer.trim();
}
