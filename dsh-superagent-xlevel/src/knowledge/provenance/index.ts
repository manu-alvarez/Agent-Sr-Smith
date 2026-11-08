export interface Citation {
  source: string;
  excerpt: string;
}

export function cite(source: string, excerpt: string): Citation {
  if (!source || !excerpt) throw new Error("una cita necesita fuente y extracto");
  return { source, excerpt: excerpt.slice(0, 280) };
}
