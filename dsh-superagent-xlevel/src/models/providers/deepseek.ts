import { HttpProvider } from "../gateway/index.ts";

export function createDeepSeekProvider(apiKey: string | undefined): HttpProvider {
  return new HttpProvider("deepseek", "https://api.deepseek.com", apiKey, true);
}
