# Model gateway

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Contrato

ModelRequest y ModelResponse son el único formato del dominio. Los adaptadores traducen HTTP. Los campos propios del proveedor no entran en el tipo de dominio.

El proveedor de referencia responde con `structured.kind = reference` y cero tokens. No es un sustituto de un modelo.

## Fallos

Sin credencial, el adaptador de red devuelve `missing_credentials` y `retryable: false`. Un HTTP 5xx es reintentable. strict-local rechaza cualquier adaptador con `network: true` antes de hacer fetch.

## Qué cruza el gateway

Una `ModelRequest` lleva `requestId`, `sessionId`, `agentId`, modelo, mensajes, parámetros y `constraints.timeoutMs` más `maxRetries`. La respuesta trae `status`, `finishReason` y `latencyMs`. Si no hay credencial, `status` es `failed` y `retryable` es false.

El adaptador de referencia no sale del proceso. DeepSeek, Anthropic, Google y el compatible con OpenAI están registrados con `verified: false`. El compatible, además, tiene `baseUrl` vacío a propósito.
