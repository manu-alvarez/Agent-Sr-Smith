# Auditoría de contenidos — Sr.Smith 1.0

Fecha: 2026-11-07. Alcance: todos los archivos del paquete, salvo `node_modules` y el estado local `.dsh/`.

## Criterio

Un archivo cumple si contiene el dato, el parámetro o el contrato que su ruta promete. Una plantilla de issue o de pull request sí puede tener huecos: el autor los rellena al abrirla. Un esquema, una política, un perfil o un prompt de sistema no puede estar vacío ni afirmar un comportamiento que el código no tiene.

## Resultado

- 0 archivos de cero bytes.
- 0 JSON inválidos.
- 0 marcadores `TODO`, `FIXME` o `TBD` en la fundación.
- El inventario exigido por `scripts/check-architecture.ts` existe y cada entrada supera 20 bytes.

## Configuración que sí es ejecutable

| Archivo | Qué concreta |
|---|---|
| `config/defaults/runtime.json` | Modo `strict-local`, perfil `engineering`, host `127.0.0.1`, puerto `8787`, modelo `dsh-reference-1`. |
| `config/environments/strict-local.json` y `local-runtime.json` | Los dos modos reales del arranque. |
| `config/models/providers.json` | URLs y `verified` de reference, ollama, deepseek, anthropic y google. |
| `config/profiles/*.json` y `config/agents/*.json` | Id de perfil, política y modelo de referencia. |
| `config/tools/native.json` | Herramientas nativas declaradas. |
| `config/policies/default.json` | Las diez reglas, el id `pol_default_autonomy` y `defaultEffect: deny`. El test de paridad las compara con `DEFAULT_POLICY`. |
| `.env.example` | `SMITH_MODE`, `SMITH_PROFILE`, `SMITH_DATA_DIR`, `SMITH_HOST`, `SMITH_PORT`. `DSH_*` sigue leyéndose en código como alias. |

El núcleo sigue decidiendo con `DEFAULT_POLICY` en TypeScript. El JSON no se carga con `node:fs` porque `src/public.ts` no puede depender de Node. La igualdad la impone el test, no una segunda implementación.

`config/models/providers.json` deja `openai-compatible.baseUrl` en cadena vacía y `verified: false`. No hay un endpoint inventado. El adaptador no se considera listo hasta que exista una URL real.

## Prompts

Hay 6 prompts de sistema, 10 de especialista y 6 de estrategia. Cada uno fija la salida que se espera y un caso negativo. Los límites comunes están solo en `prompts/system/base.md`.

## Configuración

`config/policies/default.json` contiene las diez reglas ejecutables, no un puntero. Los perfiles y los agentes de `config/` llevan roles, herramientas, capacidades y `limits`. Las herramientas nativas llevan permisos, operación y timeout de 5000 ms. `tests/contract/parity.test.ts` compara esas copias con el código. El núcleo no lee el JSON con `node:fs`: el grafo de `src/public.ts` tiene que seguir sin imports de Node.


## Lo que no se va a fingir

- `dsh-reference-1` es determinista. No es un modelo neuronal ni un desbloqueo de capacidades del proveedor.
- Los módulos marcados `contract` en `src/meta/modules.ts` no levantan MCP, Docker ni un navegador.
- Los README de `benchmarks/` describen qué mide cada carpeta. No publican una cifra que el script no haya dejado escrita.
- Las plantillas de `.github/` son formularios. Deben seguir teniendo secciones en blanco.

## Identidad

El proyecto se llama Sr.Smith. El id interno `dsh-reference-1` y el directorio de estado `.dsh/` se mantienen: los tests y los checkpoints ya los usan. Cambiarlos sin una migración sería un corte, no una mejora.
