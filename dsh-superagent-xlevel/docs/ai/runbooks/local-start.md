# Arranque local

1. Node 22. Desde la raíz: `npm install`.
2. `npm test` y `npx tsc --noEmit`.
3. `npm run doctor`. Tiene que imprimir `status` ok, modo `strict-local`, perfil `engineering` si no hay variable, 19 agentes y `networkProvidersEnabled` false.
4. `npm run demo` ejecuta un objetivo de referencia y escribe el informe en la salida estándar. El disco real no se modifica. El estado de proceso, si se pide persistencia, cae en `.dsh/`, que está en `.gitignore`.
5. `node --experimental-strip-types src/cli/index.ts serve` abre solo `127.0.0.1`. El puerto es `SMITH_PORT`, luego `DSH_PORT`, luego `8787`.

Si el doctor no está ok, no sigas con un proveedor remoto. El fallo es del plano de control, no de una clave.
