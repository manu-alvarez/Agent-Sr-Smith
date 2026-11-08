# Sr.Smith 1.0

Plataforma local de ingeniería agéntica, independiente del proveedor. Este repositorio es la fundación arquitectónica y un runtime de referencia que sí ejecuta el ciclo de control.

El nombre del proyecto es **Sr.Smith**. La línea anterior, DSH SuperAgent XLevel, queda solo como antecedente: no cambia el objetivo. No es un modelo con límites desactivados. No llama a un proveedor externo salvo que configures un adaptador y salgas de `strict-local`. Si falta la credencial, la respuesta es un error.

## Qué está vivo

- Planificador jerárquico y grafo acíclico con paralelismo.
- Seis perfiles: research, engineering, autonomous, security, full, headless.
- Diecinueve roles con permisos y presupuestos.
- Políticas: el sandbox se puede escribir; secretos, red en strict-local y borrado externo no.
- Verificación independiente y checkpoints con checksum.
- Corpus local con recuperación léxica y cita.
- Sandbox virtual, SQLite y API en `127.0.0.1`.

## Arranque

```bash
npm install
npm test
npx tsc --noEmit
node --experimental-strip-types src/cli/index.ts doctor
node --experimental-strip-types src/cli/index.ts demo
```

La variable preferida es `SMITH_*`. `DSH_*` sigue aceptada. La guía larga está en [SETUP.md](SETUP.md). La auditoría de contenidos, en [AUDIT.md](AUDIT.md). El plan de mejora, en [docs/026-plan-de-mejora.md](docs/026-plan-de-mejora.md).
