import type { ModelResponse } from "../../core/domain/index.ts";

export function shouldFallback(response: ModelResponse): boolean {
  return response.status === "failed" && Boolean(response.error?.retryable);
}
