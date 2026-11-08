# Rendimiento

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Qué se mide

El benchmark de referencia cuenta tareas completadas, pasos y tiempo de pared del runtime determinista. No promete una mejora exponencial: eso solo se afirma con una comparación repetible.

Los presupuestos de pasos y de herramientas existen para cortar, no para optimizar un modelo que este nivel no llama.

## Cifra medida

Cinco pasadas del objetivo de checkpoint, perfil engineering, el 2026-11-07: 7 de 7 tareas, 7 pasos, tiempos 19, 5, 2, 2 y 2 ms. Mediana 2 ms. Es el runtime determinista, no una inferencia.

No se publica un speedup. No se publica memoria: el script no la lee.
