# Despliegue local

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Arranque

Node 22 o superior. `npm install` dentro de este paquete, luego `npm test` y `npx tsc --noEmit`. La CLI es `node --experimental-strip-types src/cli/index.ts doctor`.

El estado queda en `.dsh/state.sqlite` y `.dsh/last-report.json`. No hace falta Docker ni una base externa.

## Arranque

Hace falta Node 22. `npm install`, `npm test` y `npx tsc --noEmit`. El doctor es `node --experimental-strip-types scripts/doctor.ts` y tiene que devolver `status: ok`, 19 agentes y `networkProvidersEnabled: false`.

El estado cae en `.dsh/`, ignorado por git. No hay Docker en el camino de referencia. Las claves no van en el repositorio.
