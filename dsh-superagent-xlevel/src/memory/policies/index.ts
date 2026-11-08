export function retain(type: "working" | "episodic" | "semantic" | "procedural"): { max: number } {
  if (type === "working") return { max: 50 };
  if (type === "episodic") return { max: 200 };
  return { max: 1000 };
}
