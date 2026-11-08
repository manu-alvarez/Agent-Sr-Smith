# Tareas completadas

Medición del runtime de referencia, perfil `engineering`, objetivo de checkpoint. Comando: `node --experimental-strip-types scripts/benchmark.ts`.

Cinco pasadas el 2026-11-07, en el mismo proceso, sin red:

| Pasada | Estado | Tareas | Completadas | Pasos | ms |
|---|---|---|---|---|---|
| 1 | completed | 7 | 7 | 7 | 19 |
| 2 | completed | 7 | 7 | 7 | 5 |
| 3 | completed | 7 | 7 | 7 | 2 |
| 4 | completed | 7 | 7 | 7 | 2 |
| 5 | completed | 7 | 7 | 7 | 2 |

Mínimo 2 ms, mediana 2 ms, máximo 19 ms. No es un speedup frente a un modelo: no hay modelo en esta medición. Una sola pasada no bastaría para publicar un percentil.
