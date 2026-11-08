# Comandos

Todos desde la raíz del paquete. Hace falta Node 22.

| Comando | Qué hace |
|---|---|
| `npm install` | Instala Ajv, TypeScript y Vitest. |
| `npm test` | Vitest, incluida la eval del runtime de referencia. |
| `npx tsc --noEmit` | Tipos estrictos. |
| `npm run doctor` | `status`, modo, perfil, 19 agentes y proveedores de red apagados. |
| `npm run demo` | Una ejecución de referencia por CLI. |
| `npm run validate` | Valida el informe de ejemplo contra los esquemas. |
| `npm run check:architecture` | Cada ruta de `scripts/inventory.json` existe y pesa al menos 20 bytes. |
| `node --experimental-strip-types src/cli/index.ts serve` | HTTP en `127.0.0.1` y `SMITH_PORT` o `8787`. |
| `python3 scripts/ai/sync-instructions.py` | Regenera adaptadores y `ai/` desde el canónico. |
| `python3 scripts/ai/validate-config.py` | Esquemas, casos, proveedores y referencias. |
| `python3 scripts/ai/check-context.py` | Falla si una proyección se editó a mano. |
| `python3 .agents/skills/review/scripts/run-review.py` | Junta las dos comprobaciones anteriores y emite un informe. |

Variables que sí lee el proceso: `SMITH_MODE`, `SMITH_PROFILE`, `SMITH_DATA_DIR`, `SMITH_HOST`, `SMITH_PORT`, y los alias `DSH_*`. `SMITH_DEEPSEEK_API_KEY` y `SMITH_OPENAI_API_KEY` están en `.env.example` comentadas porque ningún adaptador las lee.
