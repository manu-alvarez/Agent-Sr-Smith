import type { Analysis } from "../../core/domain/index.ts";

export interface ReasoningTrace {
  strategy: "hierarchical" | "comparative" | "diagnostic";
  steps: string[];
}

export function selectStrategy(analysis: Analysis): ReasoningTrace {
  if (analysis.signals.includes("security") || analysis.sensitive) {
    return {
      strategy: "diagnostic",
      steps: [
        "Separar hechos, supuestos y operaciones sensibles.",
        "Aplicar mínimo privilegio antes de proponer cambios.",
        "No convertir una denegación de política en un éxito.",
      ],
    };
  }
  if (analysis.signals.includes("research") && !analysis.signals.includes("software")) {
    return {
      strategy: "comparative",
      steps: [
        "Recuperar pasajes del corpus con procedencia.",
        "Contrastar afirmaciones con las fuentes recuperadas.",
        "Marcar como no verificado lo que el corpus no cubre.",
      ],
    };
  }
  return {
    strategy: "hierarchical",
    steps: [
      "Fijar criterios de aceptación observables.",
      "Separar diseño, implementación, prueba y revisión.",
      "Paralelizar solo tareas sin dependencia.",
    ],
  };
}
