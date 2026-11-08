import { decide, DEFAULT_POLICY } from "../../governance/policies/index.ts";
export function auditOperations(mode: "strict-local" | "local-runtime") {
  return (["secrets", "external-delete", "network", "production-change"] as const).map((operation) =>
    decide(DEFAULT_POLICY, operation, mode),
  );
}
