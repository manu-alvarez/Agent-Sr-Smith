import type { ProfileId, RunInput } from "../../core/domain/index.ts";

const PROFILES = new Set(["research", "engineering", "autonomous", "security", "full", "headless"]);

export function parseRunBody(body: unknown): RunInput | { error: string } {
  if (!body || typeof body !== "object") return { error: "cuerpo inválido" };
  const record = body as Record<string, unknown>;
  if (typeof record.objective !== "string" || !record.objective.trim()) return { error: "objective es obligatorio" };
  if (record.profileId !== undefined && (typeof record.profileId !== "string" || !PROFILES.has(record.profileId))) {
    return { error: "perfil desconocido" };
  }
  return {
    objective: record.objective,
    profileId: record.profileId as ProfileId | undefined,
    mode: record.mode === "local-runtime" ? "local-runtime" : "strict-local",
  };
}
