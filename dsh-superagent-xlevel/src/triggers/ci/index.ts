export interface CiConclusion {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | "unknown";
}

export function parseCiCheck(payload: unknown): CiConclusion | { error: string } {
  if (!payload || typeof payload !== "object") return { error: "payload vacío" };
  const record = payload as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : "";
  const status = record.status;
  if (!name || (status !== "queued" && status !== "in_progress" && status !== "completed")) {
    return { error: "check inválido" };
  }
  const conclusion = record.conclusion;
  const normalized =
    conclusion === "success" || conclusion === "failure" || conclusion === "cancelled" ? conclusion : "unknown";
  return { name, status, conclusion: normalized };
}
