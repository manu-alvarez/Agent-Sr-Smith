# Conocimiento

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Corpus local

El índice léxico parte de `src/knowledge/corpus.ts`. Cada pasaje cita su documento. Si no hay solapamiento de términos, el resultado es vacío y la investigación se marca como no cubierta.

No hay base vectorial en este nivel. Embeddings y rerank semántico quedan como contrato de adaptador, no como servicio levantado.

## Recuperación que existe hoy

El índice es léxico y vive en `src/knowledge/retrieval`. `knowledge.search` devuelve como mucho 3 pasajes. Si no hay pasaje, la afirmación queda no cubierta: el investigador no la rellena.

No hay embeddings ni reranker de red. El plugin `plugin_lexical_retriever` apunta a ese mismo módulo y declara `status: reference`.
