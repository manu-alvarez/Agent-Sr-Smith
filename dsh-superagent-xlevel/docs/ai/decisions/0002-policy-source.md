# 0002 — La política se ejecuta desde TypeScript

Fecha: 2026-11-07. Estado: vigente.

`DEFAULT_POLICY` es la fuente que llama `decide()`. `config/policies/default.json` tiene las mismas diez reglas porque `tests/contract/parity.test.ts` las compara. No se lee el JSON con `node:fs` desde el núcleo: `src/public.ts` también corre en el navegador.

Consecuencia: un cambio de regla toca los dos sitios en el mismo commit. Cargar el JSON en el arranque queda para cuando la inyección no cruce esa frontera.
