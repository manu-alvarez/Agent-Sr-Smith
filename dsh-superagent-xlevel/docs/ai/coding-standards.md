# Estándar de código

## TypeScript

- Node 22, módulos ES, `strict` en `tsconfig.json`.
- Imports con sufijo `.ts`. El núcleo no importa un SDK de proveedor.
- Un campo nuevo de dominio se cambia en `src/core/domain`, en el JSON Schema de `schemas/` y en el ejemplo de ese esquema. El ejemplo tiene que validar.
- No añadas un `try/catch` que convierta una denegación de política en éxito.

## Proyecciones

Estos pares tienen que coincidir. `scripts/ai/check-context.py` o `tests/contract/parity.test.ts` lo comprueban:

| Canónico | Proyección |
|---|---|
| `src/governance/policies/index.ts` | `config/policies/default.json` |
| `src/agents/profiles/index.ts` | `config/profiles/*.json` y `ai/agents/profiles.json` |
| `src/agents/specialists/index.ts` | `ai/agents/specs.json` |
| `src/core/lifecycle/index.ts` | `ai/workflows/phases.json` |
| `config/models/providers.json` | `ai/providers/registry.json` |
| `config/tools/native.json` | `ai/tools/native.json` |
| `prompts/` | `ai/prompts/` |
| `docs/ai/shared-context.md` | bloque compartido de `CLAUDE.md` y `GEMINI.md` |

Después de tocar el lado canónico, ejecuta `python3 scripts/ai/sync-instructions.py` y no edites la proyección a mano.

## Estilo

Prettier ya está en `.prettierrc.json`. No reformatees archivos que no has cambiado. Los textos de producto están en español; los objetivos de ejemplo pueden estar en inglés porque el analizador cubre los dos.
