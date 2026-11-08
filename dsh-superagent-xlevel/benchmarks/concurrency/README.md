# Concurrencia

El scheduler corta los lotes con `maxParallel` del perfil. En `engineering` ese tope es 4. En `headless` es 2. En `full` es 4.

Las siete tareas del objetivo de checkpoint no implican siete ejecuciones a la vez: solo entran en el lote las que ya no tienen dependencias pendientes. El grafo sigue siendo acíclico. Un ciclo no se paraleliza: se rechaza.

Esta medición no usa hilos de sistema ni contenedores. El runtime de referencia avanza el lote dentro del mismo proceso.
