export function publicUrl(path: string): string {
  const env = (import.meta as { env?: { BASE_URL?: string } }).env;
  const base = env?.BASE_URL || "/";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${suffix}`;
}
