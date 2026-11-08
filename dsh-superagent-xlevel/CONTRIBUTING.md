# Contribuir

1. Conserva los límites de dominio. `src/public.ts` no importa `node:`.
2. Un contrato nuevo actualiza el JSON Schema, el ejemplo del propio esquema y un objeto vivo en `tests/contract/schemas.test.ts`.
3. No marques como verificado un proveedor sin un probe real.
4. `npm test` y `npx tsc --noEmit` tienen que pasar.
5. No añadas capacidades ficticias para “completar” una carpeta.
6. Si cambias `DEFAULT_POLICY` o `PROFILES`, actualiza el JSON de `config/` en el mismo cambio. El test de paridad falla si divergen.
7. Un prompt de rol lleva salida concreta y un caso negativo. El bloque de límites comunes se referencia desde `prompts/system/base.md`, no se copia.
