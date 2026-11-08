import { HttpProvider } from "../gateway/index.ts";

export function createOpenAICompatibleProvider(baseUrl: string, apiKey: string | undefined): HttpProvider {
  return new HttpProvider("openai-compatible", baseUrl, apiKey, true);
}
