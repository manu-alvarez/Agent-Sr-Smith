# Latencia

Latencia de pared del runtime de referencia, sin red y sin proveedor.

En las cinco pasadas del objetivo de checkpoint (perfil `engineering`) el reloj dio 19, 5, 2, 2 y 2 ms. La primera incluye el calentamiento del proceso. No se resta. No se compara con una API remota porque `strict-local` no la llama.

El comando es `node --experimental-strip-types scripts/benchmark.ts`.
