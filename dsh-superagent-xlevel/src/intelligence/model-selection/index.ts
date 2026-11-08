import type { ExecutionMode } from "../../core/domain/index.ts";

export interface ModelCandidate {
  provider: string;
  modelId: string;
  network: boolean;
  verifiedStructuredOutput: boolean;
  latencyClass: "local" | "remote" | "reference";
  notes: string;
}

export const CANDIDATES: ModelCandidate[] = [
  {
    provider: "reference",
    modelId: "dsh-reference-1",
    network: false,
    verifiedStructuredOutput: true,
    latencyClass: "reference",
    notes: "Determinista. No es un modelo neuronal. Sirve para el ciclo de control y las pruebas.",
  },
  {
    provider: "ollama",
    modelId: "configured-at-runtime",
    network: false,
    verifiedStructuredOutput: false,
    latencyClass: "local",
    notes: "Adaptador local. La capacidad queda sin verificar hasta un probe explícito.",
  },
  {
    provider: "deepseek",
    modelId: "deepseek-chat",
    network: true,
    verifiedStructuredOutput: false,
    latencyClass: "remote",
    notes: "Adaptador opcional. Desactivado en strict-local.",
  },
  {
    provider: "openai-compatible",
    modelId: "configured-at-runtime",
    network: true,
    verifiedStructuredOutput: false,
    latencyClass: "remote",
    notes: "Cubre APIs compatibles. No se asume tool-calling hasta verificarlo.",
  },
];

export function selectModel(mode: ExecutionMode, preferred?: string): ModelCandidate {
  if (mode === "strict-local") {
    return CANDIDATES.find((candidate) => candidate.provider === "reference")!;
  }
  const requested = CANDIDATES.find((candidate) => candidate.provider === preferred);
  if (requested && !requested.network) return requested;
  if (requested && requested.network) return requested;
  return CANDIDATES[0];
}
