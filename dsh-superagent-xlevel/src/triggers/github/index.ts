export interface GithubIssueEvent {
  action: string;
  number: number;
  title: string;
  body: string;
}

export function parseGithubIssue(payload: unknown): GithubIssueEvent | { error: string } {
  if (!payload || typeof payload !== "object") return { error: "payload vacío" };
  const record = payload as Record<string, unknown>;
  const issue = record.issue;
  if (!issue || typeof issue !== "object") return { error: "falta issue" };
  const item = issue as Record<string, unknown>;
  if (typeof item.number !== "number" || typeof item.title !== "string") return { error: "issue incompleto" };
  return {
    action: typeof record.action === "string" ? record.action : "unknown",
    number: item.number,
    title: item.title,
    body: typeof item.body === "string" ? item.body : "",
  };
}
