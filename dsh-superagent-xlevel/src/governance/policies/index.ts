import type { ExecutionMode, OperationClass, Policy, PolicyDecision } from "../../core/domain/index.ts";
import { SCHEMA_VERSION } from "../../core/domain/index.ts";

export const DEFAULT_POLICY: Policy = {
  schemaVersion: SCHEMA_VERSION,
  id: "pol_default_autonomy",
  name: "Autonomía gobernada",
  version: "1.0.0",
  rules: [
    {
      id: "allow-analyze",
      operation: "analyze",
      effect: "allow",
      reason: "Analizar e investigar no sale del plano de control.",
    },
    {
      id: "allow-read",
      operation: "sandbox-read",
      effect: "allow",
      reason: "La lectura queda limitada al workspace virtual o al sandbox declarado.",
    },
    {
      id: "allow-write",
      operation: "sandbox-write",
      effect: "allow",
      reason: "Escribir dentro del sandbox es automático.",
    },
    {
      id: "allow-test",
      operation: "test",
      effect: "allow",
      reason: "Ejecutar pruebas dentro del sandbox es automático.",
    },
    {
      id: "approval-git",
      operation: "git-write",
      effect: "require-approval",
      reason: "Crear commits requiere la política del proyecto; el runtime de referencia no publica.",
    },
    {
      id: "deny-network-strict",
      operation: "network",
      effect: "deny",
      modes: ["strict-local"],
      reason: "strict-local bloquea inferencia remota y herramientas de red no autorizadas.",
    },
    {
      id: "approval-network",
      operation: "network",
      effect: "require-approval",
      modes: ["local-runtime"],
      reason: "La red solo se abre con aprobación explícita y un adaptador configurado.",
    },
    {
      id: "deny-secrets",
      operation: "secrets",
      effect: "deny",
      reason: "Los secretos no entran en prompts, checkpoints, logs ni artefactos.",
    },
    {
      id: "deny-external-delete",
      operation: "external-delete",
      effect: "deny",
      reason: "Borrar datos fuera del sandbox no está soportado y no se simula como éxito.",
    },
    {
      id: "approval-production",
      operation: "production-change",
      effect: "require-approval",
      reason: "Producción exige autorización explícita. El runtime de referencia no despliega.",
    },
  ],
};

export function decide(
  policy: Policy,
  operation: OperationClass,
  mode: ExecutionMode,
): PolicyDecision {
  const specific = policy.rules.find(
    (rule) => rule.operation === operation && (!rule.modes || rule.modes.includes(mode)),
  );
  const fallback = policy.rules.find((rule) => rule.operation === operation && !rule.modes);
  const rule = specific ?? fallback;
  if (!rule) {
    return {
      operation,
      effect: "deny",
      ruleId: "default-deny",
      reason: "Sin regla explícita, la operación se deniega.",
    };
  }
  return {
    operation,
    effect: rule.effect,
    ruleId: rule.id,
    reason: rule.reason,
  };
}

export function explainPolicy(policy: Policy = DEFAULT_POLICY): string[] {
  return policy.rules.map(
    (rule) =>
      `${rule.operation}: ${rule.effect}${rule.modes ? ` [${rule.modes.join(", ")}]` : ""} — ${rule.reason}`,
  );
}
