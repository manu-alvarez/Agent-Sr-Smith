import assert from "node:assert/strict";
import test from "node:test";
import { ollamaOrigin, parseOllamaTags } from "./ollama.ts";

test("normaliza el host de Ollama", () => {
  assert.equal(ollamaOrigin("http://100.100.2.10:11434/"), "http://100.100.2.10:11434");
  assert.throws(() => ollamaOrigin("100.100.2.10:11434"), /http/);
});

test("lee los modelos del JSON de /api/tags", () => {
  assert.deepEqual(parseOllamaTags({ models: [{ name: "qwen2.5:32b", size: 10 }, { name: "" }, {}] }), [
    { name: "qwen2.5:32b", size: 10 },
  ]);
});
