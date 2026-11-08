# Registro de capacidades

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Declarado frente a verificado

Cada modelo tiene un bloque `declared` y otro `verified`. Si no hubo probe, `verified` es null. El gateway no asume tool-calling ni salida estructurada en ese caso.

Ollama, DeepSeek y las APIs compatibles están registrados como adaptadores opcionales, no como capacidades comprobadas.

## Declarado y verificado

`cap_reference` declara `neural: false` y `maxContext` 8192, y lo verificado es `deterministic: true`. Ollama anuncia local y deja `toolCalling` y `maxContext` en `unknown`, con `verified: null`. DeepSeek y el compatible con OpenAI anuncian red y quedan sin sonda.

`verified: null` no se promociona a true por estar escrito en `config/models/providers.json`.
