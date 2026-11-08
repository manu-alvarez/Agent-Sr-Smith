# Visión del sistema

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Qué es

Sr.Smith es un monolito modular para ingeniería agéntica. El núcleo no importa SDKs de DeepSeek, OpenAI, Anthropic, Gemini ni Ollama.

El runtime de referencia (`dsh-reference-1`) es determinista. Sirve para probar el plano de control sin red y sin fingir un modelo neuronal.

## Dos modos

`strict-local` mantiene ejecución, estado y herramientas en la máquina y rechaza proveedores de red.

`local-runtime` sigue ejecutando el plano de control en local, pero permite adaptadores remotos si hay credencial y la política lo autoriza. Una credencial ausente produce un error, no una respuesta inventada.

## Piezas que ya responden

`runObjective({ objective, profileId, mode })` devuelve un informe con plan, tareas, timeline, checkpoints, verificación, memoria, eventos y auditoría. Los perfiles y sus topes están en `src/agents/profiles/index.ts`: engineering usa 36 pasos, paralelismo 4 y 240000 ms. La API local escucha en `127.0.0.1` y el puerto `SMITH_PORT` o `DSH_PORT`, 8787 si no hay ninguno.

Lo que no responde: MCP, contenedores, navegador y proveedores con `verified: null`. Están nombrados para no simularlos.
