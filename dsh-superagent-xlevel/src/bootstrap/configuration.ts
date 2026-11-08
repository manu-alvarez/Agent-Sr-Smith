import type { ExecutionMode, ProfileId } from "../core/domain/index.ts";

export interface SmithConfig {
  mode: ExecutionMode;
  profileId: ProfileId;
  dataDir: string;
  httpHost: string;
  httpPort: number;
  strictLocal: boolean;
}

/** Alias histórico. El nombre del proyecto es Sr.Smith. */
export type DshConfig = SmithConfig;

function pick(env: Record<string, string | undefined>, primary: string, legacy: string): string | undefined {
  const value = env[primary];
  if (value !== undefined && value !== "") return value;
  const previous = env[legacy];
  if (previous !== undefined && previous !== "") return previous;
  return undefined;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): SmithConfig {
  const modeValue = pick(env, "SMITH_MODE", "DSH_MODE");
  const mode: ExecutionMode = modeValue === "local-runtime" ? "local-runtime" : "strict-local";
  const profile = pick(env, "SMITH_PROFILE", "DSH_PROFILE");
  const profileId: ProfileId =
    profile === "research" ||
    profile === "engineering" ||
    profile === "autonomous" ||
    profile === "security" ||
    profile === "full" ||
    profile === "headless"
      ? profile
      : "engineering";
  const port = Number(pick(env, "SMITH_PORT", "DSH_PORT") ?? "8787");
  return {
    mode,
    profileId,
    dataDir: pick(env, "SMITH_DATA_DIR", "DSH_DATA_DIR") ?? ".dsh",
    httpHost: pick(env, "SMITH_HOST", "DSH_HOST") ?? "127.0.0.1",
    httpPort: Number.isFinite(port) ? port : 8787,
    strictLocal: mode === "strict-local",
  };
}
