import { CORPUS, type CorpusDocument } from "../corpus.ts";

export interface Chunk {
  id: string;
  documentId: string;
  title: string;
  source: string;
  text: string;
}

export interface RetrievalHit {
  id: string;
  title: string;
  source: string;
  excerpt: string;
  score: number;
}

export function chunkDocument(document: CorpusDocument, size = 420): Chunk[] {
  const words = document.body.split(/\s+/);
  const chunks: Chunk[] = [];
  let index = 0;
  for (let start = 0; start < words.length; start += 60) {
    const text = words.slice(start, start + size / 5).join(" ");
    chunks.push({
      id: `${document.id}#${index}`,
      documentId: document.id,
      title: document.title,
      source: document.source,
      text,
    });
    index += 1;
    if (start + size / 5 >= words.length) break;
  }
  return chunks;
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-záéíóúñ0-9]+/i)
    .filter((token) => token.length > 3);
}

export class LexicalIndex {
  private readonly chunks: Chunk[];

  constructor(documents: CorpusDocument[] = CORPUS) {
    this.chunks = documents.flatMap((document) => chunkDocument(document));
  }

  search(query: string, limit = 3): RetrievalHit[] {
    const queryTokens = new Set(tokens(query));
    return this.chunks
      .map((chunk) => {
        const chunkTokens = tokens(`${chunk.title} ${chunk.text}`);
        const overlap = chunkTokens.filter((token) => queryTokens.has(token)).length;
        const score = overlap / Math.sqrt(chunkTokens.length + 1);
        return {
          id: chunk.id,
          title: chunk.title,
          source: chunk.source,
          excerpt: chunk.text.slice(0, 280),
          score: Number(score.toFixed(4)),
        };
      })
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export function searchKnowledge(query: string, limit = 3): RetrievalHit[] {
  return new LexicalIndex().search(query, limit);
}
