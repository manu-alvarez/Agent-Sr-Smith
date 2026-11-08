import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function walk(file: string, seen = new Set<string>()): string[] {
  const absolute = resolve(file);
  if (seen.has(absolute)) return [];
  seen.add(absolute);
  const text = readFileSync(absolute, "utf8");
  expect(text, absolute).not.toMatch(/from ["']node:/);
  const found: string[] = [absolute];
  for (const match of text.matchAll(/from "(\.[^"]+)"/g)) {
    const spec = match[1];
    if (!spec) continue;
    const target = spec.endsWith(".ts") ? resolve(dirname(absolute), spec) : resolve(dirname(absolute), `${spec}.ts`);
    found.push(...walk(target, seen));
  }
  return found;
}

describe("public boundary", () => {
  it("keeps node builtins out of the browser entry graph", () => {
    const files = walk(resolve(root, "src/public.ts"));
    expect(files.length).toBeGreaterThan(10);
  });
});
