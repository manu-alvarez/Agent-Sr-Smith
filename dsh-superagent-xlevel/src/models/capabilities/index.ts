import type { CapabilityDescriptor, ModelCapability } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";

export const CAPABILITIES: ModelCapability[] = [
  {
    schemaVersion: SCHEMA_VERSION,
    id: "cap_reference",
    kind: "model",
    name: "Reference runtime",
    provider: "reference",
    modelId: "dsh-reference-1",
    declared: { toolCalling: false, vision: false, reasoningControl: false, maxContext: 8192, neural: false },
    verified: { structuredOutput: true, deterministic: true, neural: false },
    restrictions: ["No es un modelo. No tiene capacidades ocultas que activar."],
  },
  {
    schemaVersion: SCHEMA_VERSION,
    id: "cap_ollama",
    kind: "model",
    name: "Ollama adapter",
    provider: "ollama",
    modelId: "configured-at-runtime",
    declared: { local: true, toolCalling: "unknown", maxContext: "unknown" },
    verified: null,
    restrictions: ["Sin probe, la capacidad queda no verificada."],
  },
  {
    schemaVersion: SCHEMA_VERSION,
    id: "cap_deepseek",
    kind: "model",
    name: "DeepSeek adapter",
    provider: "deepseek",
    modelId: "deepseek-chat",
    declared: { network: true, openaiCompatible: true },
    verified: null,
    restrictions: ["Desactivado en strict-local.", "No se asumen parámetros de razonamiento no documentados en la petición."],
  },
  {
    schemaVersion: SCHEMA_VERSION,
    id: "cap_openai",
    kind: "model",
    name: "OpenAI-compatible adapter",
    provider: "openai-compatible",
    modelId: "configured-at-runtime",
    declared: { network: true, chatCompletions: true },
    verified: null,
    restrictions: ["Requiere credencial explícita.", "No se inventan respuestas si la llamada falla."],
  },
];

export function capabilityByProvider(provider: string): CapabilityDescriptor | undefined {
  return CAPABILITIES.find((capability) => capability.provider === provider);
}

export function verifiedOnly(): ModelCapability[] {
  return CAPABILITIES.filter((capability) => capability.verified !== null);
}
