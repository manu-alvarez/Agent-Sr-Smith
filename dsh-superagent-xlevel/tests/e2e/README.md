# Extremo a extremo

El ciclo vive en `tests/integration/runtime.test.ts`: HTTP en `127.0.0.1` con puerto efímero, SQLite y rollback de checkpoint.

No hay un navegador que finja un modelo. La interfaz del plano de control llama a `runObjective` en el mismo proceso. Un e2e de navegador no sustituye la comprobación de política ni el checksum.

Casos que ese archivo cubre: informe completado, denegación de red en `strict-local`, red de secretos y restauración de checkpoint.
