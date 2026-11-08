# review

Revisión determinista de un cambio en Sr.Smith. No aprueba sola un proveedor ni una política.

## Cuándo usarla

Antes de dar por cerrado un cambio de contratos, prompts, perfiles, política o proyecciones `ai/`.

## Pasos

1. Lee el diff. Si toca `src/governance/policies`, `config/policies`, `prompts/` o `src/core/lifecycle`, el otro lado de la proyección tiene que estar en el mismo cambio. La tabla está en `docs/ai/coding-standards.md`.
2. Ejecuta `python3 .agents/skills/review/scripts/run-review.py`.
3. Ejecuta `npm test` y `npx tsc --noEmit`. El script de revisión no los lanza: no sustituyen el tipo ni el runtime.
4. Rellena `assets/report.template.md`. Un `verified: true` nuevo sin probe es un fallo, no un hallazgo menor.

## Salida

El script imprime un informe con `validate` y `context`. Sale con código 1 si alguno falla. No reescribas ese resultado para que quede en verde.
