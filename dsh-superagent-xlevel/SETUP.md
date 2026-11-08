# SETUP

Requisito: Node.js 22 o superior.

```bash
npm install
npm test
npx tsc --noEmit
node --experimental-strip-types scripts/doctor.ts
```

Variables opcionales, nunca con secretos commiteados: copia `.env.example`. El modo por defecto es `strict-local`. `SMITH_MODE` tiene prioridad; `DSH_MODE` sigue aceptado.

`node --experimental-strip-types src/cli/index.ts serve` abre la API en el puerto 8787. `POST /v1/runs` con `{ "objective": "...", "profileId": "engineering" }`.

El estado queda en `.dsh/`, ignorado por git. No hace falta Docker ni una clave de modelo para el ciclo de referencia.
