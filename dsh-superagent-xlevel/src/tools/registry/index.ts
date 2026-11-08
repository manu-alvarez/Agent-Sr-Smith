import { NATIVE_TOOLS } from "../fabric.ts";
import type { ToolManifest } from "../../core/domain/index.ts";

export class ToolRegistry {
  private readonly tools = new Map<string, ToolManifest>();
  constructor(manifests: ToolManifest[] = NATIVE_TOOLS) {
    for (const manifest of manifests) this.tools.set(manifest.name, manifest);
  }
  get(name: string): ToolManifest | undefined {
    return this.tools.get(name);
  }
  list(): ToolManifest[] {
    return [...this.tools.values()];
  }
}
