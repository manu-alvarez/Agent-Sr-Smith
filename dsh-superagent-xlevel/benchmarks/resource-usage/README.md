# Recursos

El proceso de referencia no reserva GPU, no abre contenedores y no escribe fuera de `.dsh` y del sandbox virtual.

En la medición de cinco pasadas el trabajo fue 7 tareas y 7 pasos por pasada. No hay cifra de RAM publicada: el script `scripts/benchmark.ts` no lee `process.memoryUsage()`. Inventar un pico de memoria quedaría fuera de lo medido.

Red: 0 llamadas. Proveedores con `verified: null`: no se invocan.
