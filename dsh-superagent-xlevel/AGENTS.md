# AGENTS.md — Sr.Smith

Trabaja dentro de este paquete. No cambies el dominio para acoplarlo a un proveedor.

- Entrada de navegador: `src/public.ts`. No importes `node:` desde su grafo.
- Entrada de Node: `src/index.ts` y `src/cli/index.ts`.
- Los esquemas viven en `schemas/`. Cada uno trae título, descripción y un ejemplo que tiene que validar.
- Estado de cada módulo en `src/meta/modules.ts`: implemented, reference, contract o planned.
- Perfiles ejecutables: `src/agents/profiles/index.ts`. La copia de configuración es `config/profiles/*.json` y debe coincidir.
- Política ejecutable: `src/governance/policies/index.ts`. La copia es `config/policies/default.json`.
- No escribas prompts que pidan ignorar políticas o activar funciones ocultas del modelo.
- Prefijo de entorno: `SMITH_*`. `DSH_*` es alias.
- Entradas de otras herramientas: `CLAUDE.md` y `GEMINI.md`. El texto compartido vive en `docs/ai/shared-context.md`.
- `ai/` es una proyección. Se regenera con `python3 scripts/ai/sync-instructions.py`. No la edites a mano.
- La revisión determinista está en `.agents/skills/review/SKILL.md`.
