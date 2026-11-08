# Plan de mejora

Sr.Smith sigue siendo un plano de control local, gobernado por políticas, con verificación independiente del worker. Ningún punto de este plan pide desactivar salvaguardas, simular un proveedor o marcar `verified: true` sin una sonda real.

## Hecho en este corte

- Cada esquema de `schemas/` nombra los campos anidados (modelo, permisos, presupuesto, reglas, checkpoint, herramientas) y trae un ejemplo que el test valida.
- `config/policies/default.json` tiene las diez reglas, el id y el efecto por defecto `deny`. `config/profiles` y `config/agents` tienen roles, herramientas y presupuestos. `config/tools/native.json` tiene permisos y timeout. `tests/contract/parity.test.ts` exige que coincidan con el código.
- Los prompts de sistema, especialista y estrategia declaran la salida y un caso negativo. Los límites comunes viven en `prompts/system/base.md`.

## Sigue abierto

### Cargar la política desde el JSON

Hoy el JSON y `DEFAULT_POLICY` son iguales porque el test lo impone. No se lee el archivo en el arranque: `src/public.ts` no puede importar `node:` y el plano de control corre también en el navegador. El paso siguiente es inyectar el objeto ya parseado, no abrir el disco desde el núcleo.

### Probe de proveedores

Ollama, DeepSeek, Anthropic, Google y el compatible con OpenAI siguen en `verified: false`. El compatible tiene `baseUrl` vacío. No se documenta una variable de clave hasta que un adaptador la lea.

### Benchmark de memoria

La latencia y las tareas completadas ya están medidas (cinco pasadas, mediana 2 ms, 7/7 tareas). `scripts/benchmark.ts` no lee RAM. Hasta que lo haga, `benchmarks/resource-usage` no publica un pico.

## Lo que no entra

- Renombrar `dsh-reference-1` o `.dsh/` sin migración de checkpoints.
- Activar red, MCP, contenedores o navegador dentro de `strict-local`.
- Tratar un módulo `contract` como si ya prestara servicio.
- Añadir microservicios.
