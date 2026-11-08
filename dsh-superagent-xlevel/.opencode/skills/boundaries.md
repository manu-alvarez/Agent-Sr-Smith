# Fronteras

- `src/public.ts` no importa `node:`. El plano de control tiene que poder evaluarse sin sistema de archivos.
- No marques `verified: true` sin un probe que haya fallado o pasado de verdad.
- La política ejecutable es `DEFAULT_POLICY`. `config/policies/default.json` debe coincidir y el test de paridad lo comprueba.
- Un módulo `contract` no se documenta como servicio levantado.
