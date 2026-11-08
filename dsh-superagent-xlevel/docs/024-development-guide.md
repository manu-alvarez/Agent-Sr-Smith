# Guía de desarrollo

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Reglas

TypeScript strict, sin propiedades de parámetro en constructores: la CLI usa el eliminador de tipos de Node y no las soporta.

No importes `node:` desde el grafo de `src/public.ts`. La prueba de arquitectura lo recorre.

Un archivo nuevo tiene que compilar y decir su estado: implemented, reference, contract o planned.

## Dónde se cambia cada cosa

Un campo de tarea se cambia en `src/core/domain`, en `schemas/orchestration/task.schema.json` y en el ejemplo de ese esquema. Una regla nueva se cambia en `DEFAULT_POLICY` y en `config/policies/default.json` a la vez. Un rol nuevo actualiza el catálogo, el prompt en `prompts/specialists` y los perfiles que deben verlo.

`npm test` es la puerta. Si el ejemplo del esquema no valida, el esquema no está cerrado.
