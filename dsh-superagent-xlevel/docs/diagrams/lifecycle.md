# Diagrama de ciclo

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Secuencia

received → analysis → planning → policy_validation → task_graph → scheduling → delegation → execution → verification → completed.

Desde execution se puede ir a recovery. Desde recovery se puede volver a verification, scheduling, blocked o failed. No hay transición a un bucle infinito.

## Fases y datos

received guarda el objetivo. analysis clasifica idioma y riesgo. planning emite el plan. policy_validation aplica `decide()`. task_graph rechaza ciclos. scheduling forma el lote hasta `maxParallel`. delegation elige el rol. execution escribe solo en el sandbox. verification exige evidencia. recovery reintenta solo lo idempotente. El cierre es completed, blocked o failed.

Cada flecha publica `execution.<fase>`.
