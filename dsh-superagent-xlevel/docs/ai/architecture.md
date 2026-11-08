# Arquitectura para quien modifica Sr.Smith

Nivel de contexto compartido. El comportamiento lo define el código, no este archivo.

## Frontera

`src/public.ts` exporta `runObjective`, perfiles y política. `tests/architecture/boundaries.test.ts` falla si ese grafo importa `node:`. Por eso la política no se carga con `fs` en el arranque: el mismo ciclo corre en el navegador.

El proceso Node añade CLI, HTTP en `127.0.0.1:8787` y SQLite bajo `.dsh/`.

## Ciclo

`received → analysis → planning → policy_validation → task_graph → scheduling → delegation → execution → verification`, y desde ahí `completed`, `blocked`, `failed` o `recovery`. Las aristas legales están en `src/core/lifecycle/index.ts` y se proyectan a `ai/workflows/phases.json`. Una transición fuera de esa tabla lanza `Illegal phase transition`.

## Quién decide el cierre

El worker devuelve evidencia. El evaluador recorre los criterios y puede rechazar un `completed` declarado. El scheduler solo mete en el lote las tareas cuyas dependencias están `completed`, hasta `maxParallel` del perfil.

## Dónde no está el modelo

`src/models/` traduce una `ModelRequest` a un adaptador. En `strict-local` el adaptador activo es `reference`. Ollama, DeepSeek, Anthropic, Google y el compatible con OpenAI existen como código y permanecen en `verified: false`.
