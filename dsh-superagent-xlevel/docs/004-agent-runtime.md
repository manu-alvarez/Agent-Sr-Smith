# Runtime de agentes

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Roles

Hay 19 roles. No son 19 prompts copiados: cada uno tiene misión, herramientas, permisos de filesystem/red/shell/git y un `promptRef`.

El ejecutor de referencia produce artefactos estructurados y evidencia. No llama a un modelo salvo que un adaptador se invoque de forma explícita.

## Límites

Cada spec fija maxSteps, timeoutMs y maxToolCalls. El registro rechaza un spec sin rol o sin prompt.

## Límites de un agente

Cada `AgentSpec` fija `maxSteps` 8, `maxTokens` 4096, `timeoutMs` 120000 y `maxToolCalls` 12, más estrechos que el perfil. El modelo es `reference` / `dsh-reference-1`, con fallback declarado a `ollama` y `openai-compatible` que `strict-local` no llega a usar.

`permissions.network: true` no abre la red. La política puede denegar. `enabled: false` saca al agente de la delegación.
