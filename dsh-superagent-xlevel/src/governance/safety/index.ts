const INJECTION_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "ignore-instructions", pattern: /ignore (all |any )?(previous|prior|above) instructions/i },
  { id: "reveal-prompt", pattern: /reveal (the )?(system |hidden )?prompt/i },
  { id: "disable-policy", pattern: /disable (the )?(safety|policy|guard)/i },
  { id: "exfiltrate", pattern: /exfiltrat(e|ion)|steal (the )?secrets?/i },
  { id: "jailbreak", pattern: /\b(do anything now|nolimits|jailbreak)\b/i },
];

export interface ScanResult {
  flagged: boolean;
  reasons: string[];
  sanitized: string;
}

export function scanUntrusted(text: string): ScanResult {
  const reasons = INJECTION_PATTERNS.filter((rule) => rule.pattern.test(text)).map((rule) => rule.id);
  const sanitized = text.replace(/(api[_-]?key|secret|password|token)\s*[:=]\s*\S+/gi, "$1=[redacted]");
  return { flagged: reasons.length > 0, reasons, sanitized };
}

export function containsSecretMaterial(text: string): boolean {
  return /(sk-[a-z0-9]{8,}|AKIA[0-9A-Z]{8,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/.test(text);
}
