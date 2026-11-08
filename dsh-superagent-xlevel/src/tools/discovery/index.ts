import type { ToolManifest } from "../../core/domain/index.ts";

export function discover(manifests: ToolManifest[], needed: string[]): { found: ToolManifest[]; missing: string[] } {
  const found = manifests.filter((manifest) => needed.includes(manifest.name));
  const names = new Set(found.map((manifest) => manifest.name));
  return { found, missing: needed.filter((name) => !names.has(name)) };
}
