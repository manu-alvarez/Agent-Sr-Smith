import { HttpProvider } from "../gateway/index.ts";

/** Local Ollama OpenAI-compatible endpoint. network=false so strict-local may call localhost explicitly. */
export function createOllamaProvider(baseUrl = "http://127.0.0.1:11434/v1"): HttpProvider {
  return new HttpProvider("ollama", baseUrl, "local", false);
}
