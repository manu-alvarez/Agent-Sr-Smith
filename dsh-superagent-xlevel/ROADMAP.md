# ROADMAP

## Nivel 1 — esta versión

Contratos 1.0.0 con esquemas anidados, seis perfiles con presupuestos, diecinueve roles, diez reglas de política, orquestación, sandbox virtual, memoria de cuatro tipos, corpus léxico, SQLite, CLI, API y pruebas. Hecho.

Los esquemas dejan de aceptar un `model` o un `budget` como objeto vacío: exigen los campos que el runtime ya escribe.

## Nivel 2

Probe real de modelos locales, cliente MCP, worktrees de git bajo demanda y un índice vectorial opcional. Los adaptadores HTTP ya existen; `verified` sigue en false hasta la sonda.

Cargar `config/policies/default.json` en el arranque, en vez de solo comprobar que coincide, también es de este nivel: hoy el navegador no puede leer el archivo y `src/public.ts` no puede importar `node:`.

## Nivel 3

Proyectos largos con equipos sostenidos y evaluación continua. No está implementado. No se simula.
