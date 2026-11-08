# Objetivo — frontera del sandbox

Perfil: `engineering`. Modo: `strict-local`.

## Objetivo

Design the sandbox boundary and the independent verification gate for a local agent runtime.

## Criterios

- Toda escritura pasa por `sandbox-write`. Una ruta con `..` se rechaza.
- El worker no marca el plan como aceptado. Lo hace el evaluador, con un check por criterio.
- `external-delete` permanece denegado aunque el objetivo lo pida.

## Presupuesto del perfil

`maxSteps` 36, `maxParallel` 4, `timeoutMs` 240000.
