import type { ModelRequest, ModelResponse } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";

export function createGoogleAdapter(apiKey: string | undefined) {
  return {
    id: "google",
    network: true,
    async complete(request: ModelRequest): Promise<ModelResponse> {
      const started = Date.now();
      if (!apiKey) {
        return {
          schemaVersion: SCHEMA_VERSION,
          requestId: request.requestId,
          provider: "google",
          modelId: request.model.modelId,
          status: "failed",
          output: {},
          finishReason: "error",
          latencyMs: Date.now() - started,
          error: { code: "missing_credentials", message: "Falta la credencial de Google.", retryable: false },
        };
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model.modelId}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: request.messages.map((message) => String(message.content)).join("\n") }] }],
        }),
      });
      if (!response.ok) {
        return {
          schemaVersion: SCHEMA_VERSION,
          requestId: request.requestId,
          provider: "google",
          modelId: request.model.modelId,
          status: "failed",
          output: {},
          finishReason: "error",
          latencyMs: Date.now() - started,
          error: { code: "provider_http", message: `HTTP ${response.status}`, retryable: response.status >= 500 },
        };
      }
      const body = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      return {
        schemaVersion: SCHEMA_VERSION,
        requestId: request.requestId,
        provider: "google",
        modelId: request.model.modelId,
        status: "completed",
        output: { text },
        finishReason: "stop",
        latencyMs: Date.now() - started,
      };
    },
  };
}
