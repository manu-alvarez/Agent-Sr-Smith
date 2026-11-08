# Seguridad del plano de control

La política ejecutable es `pol_default_autonomy` 1.0.0. Efecto por defecto: `deny`. Reglas, en este orden:

| Id | Operación | Efecto | Modos |
|---|---|---|---|
| allow-analyze | analyze | allow | todos |
| allow-read | sandbox-read | allow | todos |
| allow-write | sandbox-write | allow | todos |
| allow-test | test | allow | todos |
| approval-git | git-write | require-approval | todos |
| deny-network-strict | network | deny | strict-local |
| approval-network | network | require-approval | local-runtime |
| deny-secrets | secrets | deny | todos |
| deny-external-delete | external-delete | deny | todos |
| approval-production | production-change | require-approval | todos |

La regla con `modes` gana a la regla general de la misma operación.

## Secretos

`scanUntrusted` sustituye `api_key=…`, `secret=…`, `password=…` y `token=…` por `[redacted]` antes de escribir memoria episódica o un artefacto de `sandbox/`. El campo `objective` del informe conserva el texto de entrada: es la petición, no un artefacto derivado. SQLite vuelve a pasar `stripSecrets` al persistir.

No pongas una clave real en `.env.example`, en un caso de eval ni en un prompt. Los casos usan el literal `sk-should-not-persist`, que el redactor tiene que eliminar.

## Lo que no se abre

MCP, el navegador y el shell de las herramientas nativas no están concedidos. `shell` es `false` en las seis herramientas de `config/tools/native.json`.
