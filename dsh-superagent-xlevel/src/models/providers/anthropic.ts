import type { ModelRequest, ModelResponse } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";

export function createAnthropicAdapter(apiKey: string | undefined) {
  return {
    id: "anthropic",
    network: true,
    async complete(request: ModelRequest): Promise<ModelResponse> {
      const started = Date.now();
      if (!apiKey) {
        return {
          schemaVersion: SCHEMA_VERSION,
          requestId: request.requestId,
          provider: "anthropic",
          modelId: request.model.modelId,
          status: "failed",
          output: {},
          finishReason: "error",
          latencyMs: Date.now() - started,
          error: { code: "missing_credentials", message: "Falta la credencial de Anthropic.", retryable: false },
        };
      }
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: request.model.modelId,
          max_tokens: request.parameters.maxOutputTokens ?? 1024,
          messages: request.messages.filter((message) => message.role !== "system"),
        }),
      });
      if (!response.ok) {
        return {
          schemaVersion: SCHEMA_VERSION,
          requestId: request.requestId,
          provider: "anthropic",
          modelId: request.model.modelId,
          status: "failed",
          output: {},
          finishReason: "error",
          latencyMs: Date.now() - started,
          error: { code: "provider_http", message: `HTTP ${response.status}`, retryable: response.status >= 500 },
        };
      }
      const body = (await response.json()) as { content?: Array<{ text?: string }> };
      return {
        schemaVersion: SCHEMA_VERSION,
        requestId: request.requestId,
        provider: "anthropic",
        modelId: request.model.modelId,
        status: "completed",
        output: { text: body.content?.map((part) => part.text ?? "").join("") ?? "" },
        finishReason: "stop",
        latencyMs: Date.now() - started,
      };
    },
  };
}
