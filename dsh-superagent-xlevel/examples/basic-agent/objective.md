# Objetivo — checkpoint

Perfil: `engineering`. Modo: `strict-local`. Política: `pol_default_autonomy`.

## Objetivo

Implement a durable checkpoint store with checksum verification and resume.

## Criterios

- El checkpoint guarda `completedTaskIds`, `pendingTaskIds` y `taskStatuses`.
- El checksum es estable: la misma estado produce el mismo resumen.
- Restaurar con otro checksum falla. No se reanuda como si coincidiera.

## No-objetivos

- No se abre red.
- No se escribe fuera de `sandbox/`.
- No se publica un commit.
