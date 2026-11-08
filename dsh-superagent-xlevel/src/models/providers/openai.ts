import { HttpProvider } from "../gateway/index.ts";

export function createOpenAIProvider(apiKey: string | undefined): HttpProvider {
  return new HttpProvider("openai", "https://api.openai.com/v1", apiKey, true);
}
