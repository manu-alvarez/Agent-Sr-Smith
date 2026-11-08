# Modelo de dominio

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Agregados

Plan, Task, Execution, Checkpoint, Policy, Approval, Audit, MemoryRecord y Event son los agregados. Todos llevan `schemaVersion` 1.0.0.

Los identificadores usan un prefijo de tres letras y un UUID: `tsk_`, `exe_`, `chk_`, `aud_`.

## Operaciones

Cada tarea declara una clase de operación: analyze, sandbox-read, sandbox-write, test, git-write, network, secrets, external-delete o production-change. La clase, no el texto del objetivo, decide la política.

## Identidad de los objetos

`schemaVersion` es `1.0.0` en todos los contratos. Los ids usan prefijo de tres letras: `exe`, `pln`, `tsk`, `agt`, `evt`, `chk`, `mem`, `tol`, `apr`, `pol`. Las fechas son ISO-8601 de al menos 20 caracteres.

Una tarea exige criterios, presupuesto (`maxSteps`, `timeoutMs`, `maxRetries`) y una operación del vocabulario de la política. Un plan exige perfil, criterios, supuestos, no-objetivos, riesgos y la lista de tareas completas, no solo sus ids.
