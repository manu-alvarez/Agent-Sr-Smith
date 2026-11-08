import { searchKnowledge } from "../../knowledge/retrieval/index.ts";
export function research(query: string) {
  const hits = searchKnowledge(query, 4);
  return { hits, covered: hits.length > 0 };
}
