# ai/

Convención de la aplicación. No es un segundo runtime.

Lo regenerable sale de `python3 scripts/ai/sync-instructions.py`:

- `prompts/` copia `prompts/` con una cabecera de origen.
- `agents/specs.json` y `agents/profiles.json` salen del catálogo TypeScript.
- `tools/native.json` copia `config/tools/native.json`.
- `workflows/phases.json` sale de `src/core/lifecycle/index.ts`.
- `schemas/catalog.json` indexa `schemas/`.
- `providers/registry.json` copia `config/models/providers.json`.

Lo escrito a mano, y que el test ejecuta, está en `evals/`. `observability/` fija qué eventos existen y la única latencia medida.
