import type { AppContainer } from "./container.ts";

export interface HealthReport {
  status: "ok" | "degraded";
  mode: string;
  profileId: string;
  agents: number;
  referenceProvider: true;
  networkProvidersEnabled: boolean;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
}

export function health(container: AppContainer): HealthReport {
  const agents = container.agents.enabled().length;
  const checks = [
    { name: "agents", ok: agents >= 19, detail: `${agents} agentes habilitados` },
    { name: "mode", ok: container.config.mode === "strict-local" || container.config.mode === "local-runtime", detail: container.config.mode },
    { name: "gateway", ok: true, detail: "reference" },
  ];
  return {
    status: checks.every((check) => check.ok) ? "ok" : "degraded",
    mode: container.config.mode,
    profileId: container.config.profileId,
    agents,
    referenceProvider: true,
    networkProvidersEnabled: !container.config.strictLocal,
    checks,
  };
}
