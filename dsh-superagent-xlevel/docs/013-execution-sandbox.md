# Sandbox

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Frontera

El sandbox de referencia es un mapa en memoria. Solo se puede escribir bajo `sandbox/`. `..` se rechaza. El material que parece una clave privada o un token `sk-` se rechaza.

Git worktrees y contenedores son adaptadores descritos, no un Docker que este proceso intente arrancar.

## Disco que sí se puede tocar

`sandbox-write` y `sandbox-read` están permitidos. La ruta se rechaza si contiene `..`. El diff que muestra el plano de control es el del sandbox virtual: el disco real del operador no se modifica.

`external-delete` no tiene modo en el que esté permitido. Simular el borrado como éxito está prohibido por la regla y por el verificador.
