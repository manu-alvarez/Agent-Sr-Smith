# Extensiones

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Manifiesto

Un plugin declara id, versión, contratos, permisos, versión de Sr.Smith y entrada. El registro debe rechazar una versión incompatible antes de cargarlo.

El ejemplo de `plugins/examples` es un manifiesto válido, no un plugin ejecutado al arranque.

## Manifiesto de plugin

Hace falta `schemaVersion` 1.0.0, `id`, `name`, `version`, `type`, `contracts`, `dshVersion`, `entry` y `enabled`. El ejemplo léxico usa `entry` `src/knowledge/retrieval/index.ts`, contratos `knowledge.search` y permisos vacíos.

Una versión de Sr.Smith incompatible se rechaza antes de cargar. El ejemplo no concede red ni shell.
