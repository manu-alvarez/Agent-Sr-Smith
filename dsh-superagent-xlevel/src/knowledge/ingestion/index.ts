export interface IngestedDocument {
  id: string;
  title: string;
  body: string;
  source: string;
}

export function ingestText(id: string, title: string, body: string, source: string): IngestedDocument {
  const clean = body.replace(/(api[_-]?key|secret|password|token)\s*[:=]\s*\S+/gi, "$1=[redacted]").trim();
  if (!clean) throw new Error("documento vacío");
  return { id, title, body: clean, source };
}
