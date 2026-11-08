export function synthesize(parts: string[]): string {
  const unique = [...new Set(parts.map((part) => part.trim()).filter(Boolean))];
  return unique.join(" ");
}
