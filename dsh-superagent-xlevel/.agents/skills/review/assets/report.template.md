# Informe de revisión

Copia este esqueleto y sustituye los campos. Debajo hay un ejemplo real del corte 1.0, no un informe vacío.

## Esqueleto

- Cambio:
- validate:
- context:
- npm test:
- tsc:
- Proveedores tocados:
- Reglas tocadas:
- Veredicto: pass o fail

## Ejemplo — proyección ai/ del 2026-11-08

- Cambio: se añaden `CLAUDE.md`, `GEMINI.md`, `docs/ai/` y `ai/` como proyección del canónico. El runtime redacta `api_key=` antes de escribir memoria y sandbox.
- validate: pass. Tres casos, catálogo de esquemas, 19 specs y seis perfiles.
- context: pass. El bloque compartido de Claude y Gemini coincide con `docs/ai/shared-context.md`.
- npm test: pass, incluida `tests/evals/reference.test.ts`.
- tsc: pass.
- Proveedores tocados: ninguno. `reference` sigue verified. El resto no.
- Reglas tocadas: ninguna. Siguen las diez.
- Veredicto: pass.
