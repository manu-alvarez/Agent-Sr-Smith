# Tool fabric

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Manifiestos

Las herramientas nativas declaran red, filesystem, shell, aprobación, timeout e idempotencia. Una herramienta desconocida falla. Un argumento con patrones de inyección se deniega antes de ejecutarse.

Governance autoriza la clase de operación. Tool fabric no se concede permisos a sí mismo.

## Seis herramientas nativas

`workspace.read` y `workspace.write` tocan el sandbox. La escritura no es idempotente y el timeout es 5000 ms. `knowledge.search`, `policy.explain`, `memory.recall` y `memory.remember` no usan disco ni red. Ninguna pide shell.

Antes de ejecutar se escanean los argumentos. Un patrón de inyección devuelve `denied` con código `prompt_injection`. Una operación denegada devuelve `policy_denied`. No se reintenta cambiando el texto del objetivo.
