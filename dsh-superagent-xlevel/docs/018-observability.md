# Observabilidad

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Qué se registra

Cada fase emite un evento con correlationId igual a la ejecución. La línea de tiempo es el registro que ve el centro de control.

No hay un colector OpenTelemetry levantado. El contrato de traza (traceId opcional en el evento) está reservado para ese adaptador.

## Qué queda trazado

Cada fase publica un evento `execution.<fase>` con `title`, `detail`, `producer: orchestrator` y el `executionId` como correlación. La línea de tiempo guarda nivel `info`, `warn`, `error` u `ok`.

`usage` cuenta `steps`, `toolCalls` y `referenceCalls`. No hay un exportador de telemetría de red en `strict-local`. Las métricas que no se miden no se inventan: el benchmark no publica RAM.
