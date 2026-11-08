# Lista de revisión

- `src/public.ts` sigue sin importar `node:`.
- Las diez reglas siguen en `docs/ai/security.md`: allow-analyze, allow-read, allow-write, allow-test, approval-git, deny-network-strict, approval-network, deny-secrets, deny-external-delete, approval-production.
- Ningún proveedor distinto de `reference` pasa a `verified: true`.
- `openai-compatible.baseUrl` sigue vacío.
- Un secreto de ejemplo no aparece en `memory` ni en `changes`. El caso es `secret-in-objective`.
- Las proyecciones de `ai/prompts`, `ai/agents`, `ai/tools`, `ai/workflows`, `ai/schemas/catalog.json` y `ai/providers` salen del script, no de una edición manual.
- Un archivo nuevo de contrato pesa más que un título. El inventario exige al menos 20 bytes, y eso no basta: tiene que tener los campos que el runtime escribe.
