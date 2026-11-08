export interface WorktreePlan {
  path: string;
  branch: string;
  command: string[];
}

export function planWorktree(executionId: string): WorktreePlan {
  const safe = executionId.replace(/[^a-z0-9_-]/gi, "").slice(0, 24);
  if (!safe) throw new Error("executionId vacío");
  const path = `.dsh/worktrees/${safe}`;
  return { path, branch: `dsh/${safe}`, command: ["git", "worktree", "add", path, "-b", `dsh/${safe}`] };
}
