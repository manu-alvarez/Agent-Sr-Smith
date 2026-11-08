import type { Analysis } from "../core/domain/index.ts";

const SIGNAL_TERMS: Record<Analysis["signals"][number], string[]> = {
  software: [
    "implement", "build", "code", "refactor", "api", "module", "function", "app", "scaffold",
    "desarroll", "implementa", "codigo", "código", "módulo", "servicio", "librer",
  ],
  research: ["research", "investig", "compare", "survey", "paper", "fuente", "rag", "síntesis", "sintesis"],
  security: ["security", "threat", "audit", "vulnerab", "owasp", "secret", "seguridad", "amenaza", "permiso"],
  operations: ["deploy", "ci", "docker", "infra", "observ", "sandbox", "worktree", "despliegue"],
  documentation: ["doc", "readme", "guide", "documenta", "manual"],
};

const SENSITIVE_TERMS = [
  "delete", "drop database", "production", "secret", "credential", "borrar", "producción",
  "produccion", "exfiltrat", "password", "token=",
];

export function analyzeObjective(objective: string): Analysis {
  const normalized = objective.toLowerCase();
  const language = /[áéíóúñ¿¡]/i.test(objective) || /\b(el|la|los|una|para|con)\b/i.test(objective) ? "es" : "en";
  const signals = (Object.keys(SIGNAL_TERMS) as Analysis["signals"]).filter((signal) =>
    SIGNAL_TERMS[signal].some((term) => normalized.includes(term)),
  );
  if (signals.length === 0) signals.push("research");
  const complexity: Analysis["complexity"] =
    objective.length > 380 || /platform|distributed|multi-?agent|arquitectura completa/.test(normalized)
      ? "high"
      : objective.length > 140
        ? "medium"
        : "low";
  const risks = SENSITIVE_TERMS.filter((term) => normalized.includes(term));
  const leaked = new Set(
    [...objective.matchAll(/(?:api[_-]?key|secret|password|token)\s*[:=]\s*(\S+)/gi)].map((match) => match[1] ?? ""),
  );
  const subjects = Array.from(
    new Set(
      objective
        .split(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9_+.-]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 4 && !leaked.has(token)),
    ),
  ).slice(0, 12);
  return {
    language,
    signals,
    complexity,
    risks,
    subjects,
    sensitive: risks.length > 0,
  };
}

export function text(language: Analysis["language"], es: string, en: string): string {
  return language === "es" ? es : en;
}
