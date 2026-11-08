# Gemini CLI — Sr.Smith

Entrada para Gemini CLI. El bloque compartido es el mismo que el de `CLAUDE.md` y sale de `docs/ai/shared-context.md`. No lo edites entre las marcas.

Los comandos se ejecutan en la raíz del paquete. `python3 scripts/ai/check-context.py` tiene que pasar antes de dar por cerrado un cambio de proyecciones. No inventes una clave en `.env.example` ni marques un proveedor remoto como verificado.

<!-- BEGIN SHARED CONTEXT -->
# Contexto compartido de Sr.Smith

Este bloque es la fuente de `CLAUDE.md` y `GEMINI.md`. Lo regenera `scripts/ai/sync-instructions.py`. No lo copies a mano en otro sitio.

## Qué es

Sr.Smith es un plano de control local para ingeniería agéntica. El runtime de referencia `dsh-reference-1` es determinista y no es un modelo neuronal. La política gana al texto del objetivo.

## Entradas

- Navegador y pruebas: `src/public.ts`. Ese grafo no importa `node:`.
- Node: `src/index.ts` y `src/cli/index.ts`.
- Perfiles ejecutables: `src/agents/profiles/index.ts`. La proyección es `config/profiles/*.json` y `ai/agents/profiles.json`.
- Política ejecutable: `src/governance/policies/index.ts`. La copia es `config/policies/default.json`. Sin regla, `decide()` deniega.
- Esquemas canónicos: `schemas/`. El índice es `ai/schemas/catalog.json`.
- Prompts canónicos: `prompts/`. `ai/prompts/` es una copia generada.

## Límites

- `strict-local` es el modo por defecto. No abre red.
- No marques `verified: true` sin un probe real. Solo `reference` lo está, y significa que se comprobó que no llama a la red.
- No escribas fuera de `sandbox/`. `external-delete` está denegado.
- No guardes secretos en memoria, artefactos, checkpoints ni logs. El objetivo puede citarse solo después de `scanUntrusted`.
- Un módulo `contract` no es un servicio levantado. MCP, contenedores y navegador no se simulan como activos.
- No pidas desactivar salvaguardas ni activar funciones ocultas del modelo.

## Comandos

```bash
npm test
npx tsc --noEmit
node --experimental-strip-types scripts/doctor.ts
python3 scripts/ai/sync-instructions.py
python3 scripts/ai/validate-config.py
python3 scripts/ai/check-context.py
```

`SMITH_*` tiene prioridad. `DSH_*` es alias. Las claves de proveedor comentadas en `.env.example` no las lee ningún adaptador.
<!-- END SHARED CONTEXT -->
