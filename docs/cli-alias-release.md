# Release del alias `sismo`

## Decisión

El paquete canónico sigue siendo `@crafter/sismo-cli`. El paquete no scoped `sismo` solo resuelve esa dependencia y ejecuta su binario, sin duplicar la implementación.

El nombre `sismo` devolvió `404 Not Found` en npm el 1 de agosto de 2026 y estaba disponible al momento de la verificación. La disponibilidad no queda reservada hasta publicar.

## Release coordinado

1. Publicar `@crafter/sismo-cli@1.0.3` desde `apps/cli`.
2. Verificar `bunx --bun @crafter/sismo-cli@1.0.3 schema latest`.
3. Publicar `sismo@1.0.0` desde `apps/cli-alias`.
4. Verificar `bunx --bun sismo schema latest` y `bunx --bun sismo latest --json` desde un directorio limpio.
5. Recién entonces anunciar `bunx sismo` en README y Developers.

Los tarballs locales de ambas versiones ya fueron probados juntos. El alias preservó la salida JSON y los exit codes del paquete canónico.
