# Seguridad

Sr.Smith no desactiva políticas por texto del usuario. Reporta problemas de la fundación como issues privados si contienen un bypass real de:

- escritura fuera de `sandbox/`
- persistencia de secretos en `.dsh`
- ejecución de red en `strict-local`
- aceptación de una tarea sin evidencia

No envíes claves en el informe. El runtime de referencia no despliega ni borra fuera del sandbox.

## Reglas que lo sostienen

`deny-secrets` y `deny-external-delete` no tienen modo: valen en `strict-local` y en `local-runtime`. La red se deniega en `strict-local` y exige aprobación en `local-runtime`. Sin regla explícita, `decide()` deniega.

Los adaptadores no leen claves desde el repositorio. Una credencial entra por argumento del proceso que llama al adaptador. Si falta, la respuesta es un error, no un texto generado.
