/** Prefixed, collision-resistant ids. Works in browsers and Node. */

const PREFIXES = {
  exe: "execution",
  pln: "plan",
  tsk: "task",
  agt: "agent",
  evt: "event",
  aud: "audit",
  chk: "checkpoint",
  mem: "memory",
  tol: "tool",
  apr: "approval",
  ver: "verification",
  rec: "recovery",
  pol: "policy",
} as const;

export type IdPrefix = keyof typeof PREFIXES;

export function createId(prefix: IdPrefix): string {
  return `${prefix}_${randomUuid()}`;
}

function randomUuid(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") return cryptoRef.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (digit) => {
    const value = Number(digit);
    const random = Math.floor(Math.random() * 16);
    return (value ^ (random >> (value / 4))).toString(16);
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

/** FNV-1a 32-bit. Integrity checksum, not a security MAC. */
export function checksum(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function assertId(value: string, prefix: IdPrefix): void {
  if (!value.startsWith(`${prefix}_`)) {
    throw new Error(`Expected id prefix ${prefix}, received ${value}`);
  }
}

export const ID_PREFIX_MEANINGS = PREFIXES;
