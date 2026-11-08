# Gobernanza

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Matriz

Analizar, leer y escribir el sandbox, y probar, están permitidos. La red se niega en strict-local y exige aprobación en local-runtime. Secretos y borrado externo se niegan siempre. Git y producción exigen aprobación, y el runtime de referencia no publica ni despliega.

La auditoría redacta patrones `api_key=`, `secret=` y similares antes de persistir.

## Las diez reglas

Se permiten analyze, sandbox-read, sandbox-write y test. Exigen aprobación git-write y production-change. La red se deniega en `strict-local` y exige aprobación en `local-runtime`. Secretos y borrado externo se deniegan en los dos modos.

La regla con `modes` gana a la regla general de la misma operación. Si no hay regla, el efecto es deny y el id es `default-deny`.
