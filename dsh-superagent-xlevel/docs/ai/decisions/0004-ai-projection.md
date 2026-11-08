# 0004 — ai/ y los adaptadores son una proyección

Fecha: 2026-11-08. Estado: vigente.

`prompts/`, `schemas/`, `config/` y `src/` siguen siendo el canónico. `ai/`, `CLAUDE.md` y `GEMINI.md` existen para la convención de agentes de código: un sitio donde mirar prompts, roles, herramientas, flujos, esquemas, proveedores, evals y observabilidad.

`scripts/ai/sync-instructions.py` regenera lo que se puede derivar. `scripts/ai/check-context.py` falla si alguien edita la copia. Las evals de `ai/evals/` no se generan: son casos escritos y el test los ejecuta.

Consecuencia: no hay una segunda política ni un segundo catálogo de agentes mantenido a mano.
