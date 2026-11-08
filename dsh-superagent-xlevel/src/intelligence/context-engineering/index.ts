export interface ContextBudget {
  maxChars: number;
  used: number;
  sections: Array<{ name: string; chars: number }>;
}

/** Packs context by priority and drops the tail. Does not invent hidden context windows. */
export function packContext(
  sections: Array<{ name: string; text: string; priority: number }>,
  maxChars: number,
): { text: string; budget: ContextBudget } {
  const ordered = [...sections].sort((a, b) => a.priority - b.priority);
  const kept: string[] = [];
  const usedSections: Array<{ name: string; chars: number }> = [];
  let used = 0;
  for (const section of ordered) {
    const block = `## ${section.name}\n${section.text.trim()}\n`;
    if (used + block.length > maxChars) continue;
    kept.push(block);
    used += block.length;
    usedSections.push({ name: section.name, chars: block.length });
  }
  return {
    text: kept.join("\n"),
    budget: { maxChars, used, sections: usedSections },
  };
}
