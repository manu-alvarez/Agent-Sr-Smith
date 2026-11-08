# Pruebas

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Suites

Vitest cubre el ciclo de los seis perfiles, políticas, sandbox, memoria, el gateway de referencia y los esquemas JSON contra objetos vivos.

No se debilitan aserciones para obtener verde. Un objetivo vacío debe fallar. Un borrado externo no se marca como hecho.

## Qué cubre la suite

Contrato: cada esquema compila y los objetos vivos del runtime pasan. Paridad: la política, los perfiles y las herramientas nativas coinciden con su JSON. Motor: perfiles, ciclos, denegación. Integración: HTTP, SQLite y rollback. Arquitectura: `public.ts` sin `node:`.

Un esquema nuevo sin ejemplo válido no entra. Un JSON de configuración que se quede en un id suelto rompe la paridad.
