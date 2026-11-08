# Memoria

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Cuatro tipos

Working, episodic, semantic y procedural. La consolidación promueve una nota de trabajo repetida al menos dos veces a memoria semántica.

La memoria no sustituye la tabla transaccional de ejecuciones. SQLite guarda el informe; la memoria es recuperación cognitiva.

## Qué se guarda

Una nota tiene `type`, `content`, `provenance.source`, `provenance.createdAt` y `confidence` entre 0 y 1. El orquestador escribe confianza 1 y 0.8 según el caso. La consolidación sube una nota de trabajo repetida al menos dos veces, con confianza `min(0.95, 0.5 + ocurrencias * 0.15)`.

SQLite guarda el informe de ejecución. La memoria no lo reemplaza ni almacena secretos.
