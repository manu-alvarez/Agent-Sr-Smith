import type { ExecutionMode, ModelRequest, ModelResponse } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";
import { CANDIDATES } from "../../intelligence/model-selection/index.ts";

export interface ProviderAdapter {
  id: string;
  network: boolean;
  complete(request: ModelRequest): Promise<ModelResponse>;
}

export class ReferenceProvider implements ProviderAdapter {
  id = "reference";
  network = false;

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    return {
      schemaVersion: SCHEMA_VERSION,
      requestId: request.requestId,
      provider: "reference",
      modelId: "dsh-reference-1",
      status: "completed",
      output: {
        text: "Referencia determinista. El ciclo de control no depende de este texto.",
        structured: { kind: "reference", note: "not-a-neural-model" },
      },
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      finishReason: "stop",
      latencyMs: Date.now() - started,
    };
  }
}

export class HttpProvider implements ProviderAdapter {
  readonly id: string;
  readonly network: boolean;
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  constructor(id: string, baseUrl: string, apiKey: string | undefined, network = true) {
    this.id = id;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.network = network;
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    if (!this.apiKey && this.network) {
      return failed(request, this.id, "missing_credentials", "Falta la credencial del proveedor. No se inventa una respuesta.", false, started);
    }
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: request.model.modelId,
          messages: request.messages,
          temperature: request.parameters.temperature,
        }),
      });
      if (!response.ok) {
        return failed(request, this.id, "provider_http", `HTTP ${response.status}`, response.status >= 500, started);
      }
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return {
        schemaVersion: SCHEMA_VERSION,
        requestId: request.requestId,
        provider: this.id,
        modelId: request.model.modelId,
        status: "completed",
        output: { text: body.choices?.[0]?.message?.content ?? "" },
        finishReason: "stop",
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      return failed(request, this.id, "provider_unreachable", error instanceof Error ? error.message : String(error), true, started);
    }
  }
}

function failed(
  request: ModelRequest,
  provider: string,
  code: string,
  message: string,
  retryable: boolean,
  started: number,
): ModelResponse {
  return {
    schemaVersion: SCHEMA_VERSION,
    requestId: request.requestId,
    provider,
    modelId: request.model.modelId,
    status: "failed",
    output: {},
    finishReason: "error",
    latencyMs: Date.now() - started,
    error: { code, message, retryable },
  };
}

export class ModelGateway {
  private readonly providers: ProviderAdapter[];
  private readonly mode: ExecutionMode;

  constructor(providers: ProviderAdapter[], mode: ExecutionMode) {
    this.providers = providers;
    this.mode = mode;
  }

  static reference(mode: ExecutionMode = "strict-local"): ModelGateway {
    return new ModelGateway([new ReferenceProvider()], mode);
  }

  async complete(request: ModelRequest): Promise<ModelResponse> {
    const provider = this.providers.find((item) => item.id === request.model.provider) ?? this.providers[0];
    if (!provider) {
      return failed(request, request.model.provider, "no_provider", "No hay adaptador.", false, Date.now());
    }
    if (this.mode === "strict-local" && provider.network) {
      return failed(request, provider.id, "strict_local", "strict-local rechaza proveedores de red.", false, Date.now());
    }
    const known = CANDIDATES.find((candidate) => candidate.provider === provider.id);
    if (known && !known.verifiedStructuredOutput && request.parameters.responseFormat === "json" && provider.network) {
      return failed(
        request,
        provider.id,
        "unverified_capability",
        "La salida estructurada no está verificada para este proveedor.",
        false,
        Date.now(),
      );
    }
    return provider.complete(request);
  }
}
