# Filosofía

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Silencio y evidencia

Un agente no declara una tarea terminada porque el texto de su respuesta lo dice. La terminación la decide el verificador, con criterios escritos antes de ejecutar.

El sistema no pide al modelo que ignore límites, active modos ocultos o simule capacidades que el proveedor no expone. Esa petición no es una función de software.

## Autonomía gobernada

La autonomía es un ciclo persistente con presupuesto: analizar, planificar, validar políticas, ejecutar en aislamiento, verificar y, si hace falta, recuperar o escalar.

Detenerse al agotar pasos, tiempo o una política no es un fallo de ambición. Es la condición que hace el sistema usable.

## Parámetros que no se negocian

La política de serie tiene diez reglas y el efecto por defecto es denegar. `strict-local` es el modo si `SMITH_MODE` no dice `local-runtime`. El modelo de referencia es `dsh-reference-1`, determinista, con `neural: false` y `verified: true` solo en ese sentido: se comprobó que no llama a la red, no que sea un modelo de lenguaje.

Un objetivo vacío no genera un plan de relleno. La fase pasa a `failed`. Un criterio sin evidencia no se acepta aunque el worker haya escrito `completed`.
