# Pruebas

## Suite

`npm test` ejecuta Vitest. Hoy cubre el motor, el contrato de esquemas, la paridad de configuración, la arquitectura de `public.ts`, la política, el checkpoint y el HTTP local. `tests/evals/reference.test.ts` ejecuta los casos de `ai/evals/cases/` contra `runObjective` y los puntúa con `ai/evals/scorers/reference.json`.

`npx tsc --noEmit` es independiente. Los dos tienen que pasar.

## Qué no sustituye un test

- Un prompt más largo no demuestra que el runtime lo lea. El runtime de referencia no carga esos markdown.
- Un proveedor con `verified: false` no se prueba contra la red en esta suite.
- No publiques una cifra de RAM: `scripts/benchmark.ts` no llama a `process.memoryUsage()`.

## Añadir un caso

1. Crea `ai/evals/cases/<id>.json` con `id`, `objective`, `profileId`, `mode` y `expect`.
2. Añade la misma línea a `ai/evals/datasets/reference-runtime.jsonl`.
3. `npm test` tiene que fallar si el runtime no cumple `expect`. No relajes el caso para que pase.
