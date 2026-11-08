# Recuperación

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Presupuesto

Una tarea con evidencia insuficiente puede reintentarse una vez. Si el mismo conjunto de tareas listas se repite más de dos veces, el watchdog corta el bucle.

Un checkpoint guarda estados y un checksum FNV-1a. No es un MAC de seguridad. Si el checksum no coincide, no se considera íntegro.

## Cuándo se reintenta

`retry` solo si queda presupuesto y la acción es idempotente. `workspace.write` no lo es. Un borrado no se repite. Si no se puede reintentar, la acción es `replan`, `rollback` o `escalate`, con el motivo y el presupuesto restante.

El checkpoint guarda el estado y un checksum. Restaurar con otro checksum es fallo.
