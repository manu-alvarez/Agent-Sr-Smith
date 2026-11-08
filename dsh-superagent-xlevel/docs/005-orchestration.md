# Orquestación

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Grafo

El planner elige etapas según el perfil y las señales del objetivo. Las dependencias que no están activas se eliminan. El grafo se sella: una dependencia ausente o un ciclo abortan la construcción.

El scheduler forma lotes paralelos estables, con tope `maxParallel` del perfil.

## Ciclo

El orquestador avanza por fases legales. Un salto no declarado en el mapa de transiciones lanza un error en lugar de continuar en silencio.

## Fases legales

El orden de trabajo es received, analysis, planning, policy_validation, task_graph, scheduling, delegation, execution, verification. Desde verification se puede ir a completed, blocked, failed o recovery. Una transición fuera de ese grafo la corta `assertTransition`.

El scheduler solo mete en el lote las tareas cuyas dependencias están `completed`, y corta el lote en `maxParallel` del perfil.
