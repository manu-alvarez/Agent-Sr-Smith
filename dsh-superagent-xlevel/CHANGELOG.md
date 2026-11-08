# Changelog

## 1.0.0

Fundación publicada como **Sr.Smith** (antecedente: DSH SuperAgent XLevel). Contratos 1.0.0, seis perfiles, runtime de referencia, políticas, sandbox virtual, verificación independiente, SQLite, CLI y API local. `SMITH_*` es el prefijo de entorno; `DSH_*` permanece como alias.

Los esquemas dejan de aceptar objetos anidados vacíos: modelo, presupuesto, permisos, reglas y checkpoint tienen los campos que el runtime escribe, más un ejemplo que valida. `config/policies/default.json`, los perfiles y las herramientas nativas contienen los mismos parámetros que el código. Un test de paridad falla si se separan. Los prompts de rol declaran la salida y un caso negativo en vez de repetir tres líneas.

La convención de agentes de código queda en `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `docs/ai/` y `.agents/skills/review/`. `ai/` proyecta prompts, roles, herramientas, fases, esquemas y proveedores. `scripts/ai/` regenera esa proyección y falla si se edita a mano. Los casos de `ai/evals/` se ejecutan contra el runtime de referencia. Un `api_key=` en el objetivo no llega a la memoria ni al artefacto del sandbox.
