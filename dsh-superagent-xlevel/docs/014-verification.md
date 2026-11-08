# Verificación

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Independencia

El evaluador recorre los criterios de cada tarea y los del plan. Un criterio sin evidencia no pasa. Una tarea fallida impide la aceptación global.

El worker no es el revisor. La revisión de código es otra tarea, con otro rol.

## Qué cuenta como evidencia

El evaluador recorre los criterios del plan y los de cada tarea. Cada check guarda `criterion`, `passed` y `evidence`. `accepted` exige que todos pasen y que no haya tareas `failed`.

El rol reviewer no repite el resumen del developer. Si lo hace, la verificación falla aunque el texto sea largo.
