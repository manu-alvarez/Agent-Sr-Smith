# ADR-0001 Monolito modular

Nivel 1 — fundación arquitectónica. Lo marcado como referencia funciona en local y no simula un proveedor externo.

## Decisión

Se adopta un monolito modular en TypeScript. Los proveedores son adaptadores. El estado de referencia vive en SQLite local. La interfaz de control consume el mismo núcleo puro que las pruebas.

Se rechaza empezar con microservicios y se rechaza atar el dominio a un único proveedor de modelos.

## Consecuencias

Añadir un proveedor nuevo no cambia Plan ni Task. Añadir una herramienta nueva pasa por manifiesto y política. El precio es disciplina de imports, no infraestructura distribuida.
