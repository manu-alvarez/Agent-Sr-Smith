# Seguridad

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Amenazas

Inyección de instrucciones en argumentos de herramientas, escape de ruta, exfiltración de secretos y confusión entre capacidad declarada y verificada.

El texto del objetivo no tiene autoridad para desactivar políticas. Si contiene patrones de jailbreak, queda registrado como desviación y se ignora como orden.

## Qué se busca

Inyección en argumentos de herramienta, escape de ruta, secreto en objetivo o en artefacto, y una operación denegada presentada como hecha. El escáner de argumentos deniega antes de tocar el sandbox.

No se escriben exploits ni se piden credenciales en el prompt. Un informe de seguridad cita la regla (`deny-secrets`, `deny-network-strict`, `deny-external-delete`) y el efecto.
