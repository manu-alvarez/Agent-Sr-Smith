import type { WorkspaceChange, WorkspaceFile } from "../../core/domain/index.ts";

const SANDBOX_PREFIX = "sandbox/";

export class VirtualSandbox {
  private readonly files = new Map<string, string>();

  constructor(seed?: WorkspaceFile[]) {
    for (const file of seed ?? defaultSeed()) this.files.set(file.path, file.content);
  }

  list(): WorkspaceFile[] {
    return [...this.files.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, content]) => ({ path, content }));
  }

  read(path: string): string {
    const normalized = normalize(path);
    const content = this.files.get(normalized);
    if (content === undefined) throw new SandboxError("not_found", `No existe ${normalized}`);
    return content;
  }

  write(path: string, content: string): WorkspaceChange {
    const normalized = normalize(path);
    assertInside(normalized);
    if (looksLikeSecret(content)) {
      throw new SandboxError("secret_rejected", "El sandbox rechaza material secreto.");
    }
    const before = this.files.get(normalized);
    this.files.set(normalized, content);
    return { path: normalized, op: "write", before, after: content };
  }

  remove(path: string): WorkspaceChange {
    const normalized = normalize(path);
    assertInside(normalized);
    const before = this.files.get(normalized);
    if (before === undefined) throw new SandboxError("not_found", `No existe ${normalized}`);
    this.files.delete(normalized);
    return { path: normalized, op: "delete", before };
  }
}

export class SandboxError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SandboxError";
    this.code = code;
  }
}

function normalize(path: string): string {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") throw new SandboxError("path_escape", "La ruta intenta salir del sandbox.");
    parts.push(part);
  }
  return parts.join("/");
}

function assertInside(path: string): void {
  if (!path.startsWith(SANDBOX_PREFIX)) {
    throw new SandboxError("outside_sandbox", `Solo se puede escribir en ${SANDBOX_PREFIX}`);
  }
}

function looksLikeSecret(content: string): boolean {
  return /-----BEGIN [A-Z ]+PRIVATE KEY-----|sk-[a-zA-Z0-9]{12,}/.test(content);
}

function defaultSeed(): WorkspaceFile[] {
  return [
    {
      path: "README.md",
      content: "# Virtual project\n\nRead-only seed. Writes must go under sandbox/.\n",
    },
    {
      path: "sandbox/.gitkeep",
      content: "",
    },
  ];
}

export const SANDBOX_ROOT = SANDBOX_PREFIX;
