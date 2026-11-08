# 0001 — El runtime de referencia no es un modelo

Fecha: 2026-11-07. Estado: vigente.

`dsh-reference-1` cierra el ciclo sin red y sin pesos. `verified: true` en ese proveedor significa que se comprobó que es determinista y que `neural` es false. No significa que haya un modelo local oculto.

Consecuencia: los benchmarks de `benchmarks/` miden este proceso. La mediana de 2 ms en el objetivo de checkpoint no se compara con una API.
