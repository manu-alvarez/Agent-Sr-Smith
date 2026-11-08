export const EMBEDDINGS_STATUS = "contract" as const;

export interface EmbeddingProvider {
  id: string;
  dimensions: number | null;
  embed(text: string): Promise<number[]>;
}

export function unavailableEmbedding(id: string): EmbeddingProvider {
  return {
    id,
    dimensions: null,
    embed() {
      return Promise.reject(new Error(`Embeddings de ${id} no están verificados ni configurados.`));
    },
  };
}
