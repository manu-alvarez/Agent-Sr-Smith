export function assertSandboxPath(path: string): string {
  const parts: string[] = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") throw new Error("escape de ruta");
    parts.push(part);
  }
  const normalized = parts.join("/");
  if (!normalized.startsWith("sandbox/")) throw new Error("fuera del sandbox");
  return normalized;
}
