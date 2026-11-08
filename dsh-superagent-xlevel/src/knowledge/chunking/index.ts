export function chunkWords(text: string, size = 80, overlap = 20): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let start = 0; start < words.length; start += Math.max(1, size - overlap)) {
    chunks.push(words.slice(start, start + size).join(" "));
    if (start + size >= words.length) break;
  }
  return chunks;
}
