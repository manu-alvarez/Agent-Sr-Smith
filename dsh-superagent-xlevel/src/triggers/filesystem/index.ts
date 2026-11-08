export interface FileWatch {
  root: string;
  ignore: string[];
}

export function watchPlan(root: string): FileWatch {
  const normalized = root.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!normalized || normalized.includes("..")) throw new Error("raíz de vigilancia inválida");
  return { root: normalized, ignore: [".dsh", "node_modules", "dist"] };
}
