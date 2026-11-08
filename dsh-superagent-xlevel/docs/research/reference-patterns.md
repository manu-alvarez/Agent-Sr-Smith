# Patrones de referencia

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Qué se toma

De los runtimes de agentes abiertos se toma la separación entre ciclo, herramientas, sesión y adaptador de modelo, más la persistencia de checkpoints.

No se copia un framework concreto. Los nombres de este repositorio y los contratos son propios.

## Qué se tomó de los patrones conocidos

Del trabajo publicado sobre runtimes de agente se usan tres ideas concretas: el estado se checkpointa, la verificación no es el mismo agente que implementa, y las herramientas pasan por un manifiesto con permisos.

No se copia un framework. No hay dependencia de LangGraph ni de un SDK de proveedor en el núcleo. El grafo es el de Sr.Smith, con las fases de arriba y la política de diez reglas.
