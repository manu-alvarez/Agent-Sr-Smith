# Arquitectura

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Monolito modular

No hay microservicios en esta fase. Cada carpeta de `src/` es un límite de dominio. Las dependencias apuntan hacia contratos, no hacia adaptadores concretos de otro dominio.

El composition root está en `src/bootstrap`. El API y la CLI lo usan. La interfaz de control importa solo `src/public.ts`, que no toca `node:`.

## Qué no cruza el límite

Orchestration no ejecuta herramientas privilegiadas. Tools no se autoriza a sí mismo. Verification no hereda el estado que declara el worker. Governance no delega el permiso en el modelo.

## Frontera que el test vigila

`tests/architecture/boundaries.test.ts` recorre el grafo de `src/public.ts` y falla si aparece un import `node:`. Por eso la política ejecutable vive en TypeScript y el JSON de `config/policies/default.json` se comprueba aparte, en el test de paridad, en vez de leerse con `node:fs` desde el núcleo.

El monolito se parte por dominios: orquestación, agentes, modelos, herramientas, verificación, recuperación, gobierno y persistencia. Un dominio no llama al SDK de un proveedor.
