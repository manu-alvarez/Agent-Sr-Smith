import { CAPABILITIES } from "../capabilities/index.ts";
import type { ModelCapability } from "../../core/domain/index.ts";

export class ModelRegistry {
  private readonly items: ModelCapability[];

  constructor(items: ModelCapability[] = CAPABILITIES) {
    this.items = items;
  }

  list(): ModelCapability[] {
    return this.items.map((item) => structuredClone(item));
  }

  requireVerified(provider: string): ModelCapability {
    const found = this.items.find((item) => item.provider === provider);
    if (!found) throw new Error(`Proveedor no registrado: ${provider}`);
    if (!found.verified) throw new Error(`Proveedor sin capacidades verificadas: ${provider}`);
    return found;
  }
}
