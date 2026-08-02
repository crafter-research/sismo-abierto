# Release del alias `sismo`

## Decisión

El paquete canónico sigue siendo `@crafter/sismo-cli`. El paquete no scoped `sismo` solo resuelve esa dependencia y ejecuta su binario, sin duplicar la implementación.

El nombre `sismo` devolvió `404 Not Found` en npm el 1 de agosto de 2026 y quedó reservado con la publicación de `sismo@1.0.0` el 2 de agosto de 2026.

## Release completado

- [x] `@crafter/sismo-cli@1.0.3` publicado y verificado desde el registry.
- [x] `sismo@1.0.0` publicado el 2 de agosto de 2026.
- [x] `bunx --bun sismo@1.0.0 schema latest` validado desde un directorio limpio.
- [x] `bunx --bun sismo@1.0.0 latest --json` validado contra una consulta real.
- [x] `bunx sismo` anunciado en README y Developers.

El paquete publicado tiene shasum `c8d793c54c877f364e556271db3f645b1c698205`. El alias preserva la salida JSON y los exit codes del paquete canónico.
