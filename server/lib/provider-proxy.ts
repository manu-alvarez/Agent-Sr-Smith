type Provider = "openai" | "openrouter" | "nvidia" | "anthropic" | "google";
type ProxyInput = { provider?: Provider; action?: "models" | "chat"; apiKey?: string; model?: string; system?: string; user?: string };

const BASE_URLS: Record<Provider, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  nvidia: "https://integrate.api.nvidia.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function handleProviderProxy(input: unknown): Promise<Response> {
  const payload = (input && typeof input === "object" ? input : {}) as ProxyInput;
  const provider = payload.provider;
  if (!provider || !Object.hasOwn(BASE_URLS, provider)) return jsonResponse({ error: "unsupported_provider" }, 400);
  const apiKey = typeof payload.apiKey === "string" ? payload.apiKey.trim() : "";
  if (!apiKey || apiKey.length > 4096) return jsonResponse({ error: "invalid_api_key" }, 400);

  const base = BASE_URLS[provider];
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (provider === "anthropic") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else if (provider !== "google") {
    headers.authorization = "Bearer " + apiKey;
  }

  try {
    if (payload.action === "models") {
      const url = provider === "google" ? base + "/models?key=" + encodeURIComponent(apiKey) : base + "/models";
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
      return new Response(await response.text(), {
        status: response.status,
        headers: { "content-type": response.headers.get("content-type") || "application/json", "cache-control": "no-store" },
      });
    }

    if (payload.action !== "chat" || typeof payload.model !== "string" || !payload.model.trim()) {
      return jsonResponse({ error: "chat_action_and_model_required" }, 400);
    }
    const system = typeof payload.system === "string" ? payload.system.slice(0, 30_000) : "";
    const user = typeof payload.user === "string" ? payload.user.slice(0, 60_000) : "";
    if (!user.trim()) return jsonResponse({ error: "user_prompt_required" }, 400);

    let url: string;
    let body: unknown;
    if (provider === "anthropic") {
      url = base + "/messages";
      body = { model: payload.model, max_tokens: 8192, system, messages: [{ role: "user", content: user }] };
    } else if (provider === "google") {
      url = base + "/models/" + encodeURIComponent(payload.model) + ":generateContent?key=" + encodeURIComponent(apiKey);
      body = { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { maxOutputTokens: 16384 } };
    } else {
      url = base + "/chat/completions";
      body = { model: payload.model, max_tokens: 16384, stream: false, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
    }
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") || "application/json", "cache-control": "no-store" },
    });
  } catch {
    return jsonResponse({ error: "provider_unavailable_or_timeout" }, 502);
  }
}
