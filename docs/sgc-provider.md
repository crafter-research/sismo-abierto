# Provider Colombia: Servicio Geológico Colombiano

Estado: implementado y **activo en producción** desde el merge del PR #11.
`sismo.crafter.run/colombia` responde 200 y sirve datos del SGC (verificado 2026-08-19).

El gate es `SISMO_SGC_PROVIDER === "true"` (`packages/data/src/adapters/sgc.ts:267`), y esa
variable está puesta en el entorno de producción. En tests el provider se enciende solo.

## Decisión

La integración es técnicamente viable y está encendida. **La autorización escrita del
Servicio Geológico Colombiano para ingestión automatizada, caché, transformación y
republicación sigue pendiente**: el provider se activó sin ella.

Esto queda registrado como deuda abierta, no como estado deseado. Las opciones son pedir la
autorización al SGC o apagar `SISMO_SGC_PROVIDER` hasta tenerla. Comparar con el provider de
CENEPRED, cuyo gate se abrió recién con permiso por escrito (`docs/cenepred-provider.md`).

El nombre oficial es **Servicio Geológico Colombiano (SGC)**. La aplicación debe presentarse
como independiente, sin usar el logo del SGC y sin sugerir respaldo institucional.

## Arquitectura por intención

| Intención | Fuente | Uso |
|---|---|---|
| Último evento | `archive.sgc.gov.co/feed/v1.0.1/summary/five_days_all.json` | Filtrar `agency === "SGC"` y ordenar por `utcTime` |
| Catálogo | `api.sgc.gov.co/biweekly/biweekly_earthquakes` | Consultas en hora de Bogotá, ventanas de hasta 14 días y deduplicación por ID |
| Detalle | `archive.sgc.gov.co/events/{id}/detail.json` | Snapshot oficial, intensidad y estado de revisión |

`notifications` contiene eventos destacados y no reemplaza el catálogo. `apicatalogador` y
el servicio ArcGIS legado no son dependencias primarias por su comportamiento inestable.

## Mapeo normalizado

| SGC | Sismo Abierto | Regla |
|---|---|---|
| `feature.id` | `sourceEventId` | Se conserva sin cambios |
| `feature.id` | `id` | Prefijo `sgc-` para evitar colisiones |
| `properties.agency` | `agency` | Solo se aceptan eventos `SGC` |
| `properties.status` | `reviewStatus` | `automatic` es preliminar, `manual` fue revisado |
| `properties.utcTime` | `timeUtc` | Instante canónico |
| `properties.localTime` | `timeLocal` | `America/Bogota`, UTC-5 |
| `properties.mag` | `magnitude` | Se conserva el valor publicado |
| `properties.magType` | `magnitudeType` | Se conserva si está disponible |
| `properties.mmi` | `intensity` | Intensidad publicada como `MMI n`, si existe |
| coordenadas | `longitude`, `latitude`, `depthKm` | Regla distinta según la fuente |

La diferencia de coordenadas es crítica:

- `archive` y `detail` publican `[latitud, longitud, profundidad]`.
- `biweekly` publica GeoJSON estándar `[longitud, latitud, profundidad]`.

El campo `updated` no se usa para ordenar ni deduplicar porque se observaron zonas horarias
inconsistentes. Los eventos pueden cambiar después del primer reporte, por eso se conserva
el estado de revisión y la hora de consulta.

## Comportamiento operacional observado

- El feed estático publica `ETag` y `Last-Modified` y acepta revalidación HTTP `304`.
- La API quincenal no publica documentación, SLA ni límites de tasa.
- Algunas fallas aparecen como HTTP `200` con un error `503` anidado.
- El adaptador divide las consultas en ventanas de 14 días con concurrencia controlada.
  Admite hasta 31 días sin filtro y hasta 366 días cuando `minMagnitude >= 3`.
- El catálogo anual muestra meses sin resultados en cero. En la consulta verificada de 2026,
  el origen no devolvió registros de enero ni febrero y comenzó a devolverlos en marzo.
- Los feeds contienen agencias externas. La integración estricta filtra `agency === "SGC"`.
- Esta fuente reporta eventos ocurridos. No es predicción ni alerta temprana.

## Activación y atribución

En tests el provider está disponible. Todo acceso real, incluido desarrollo local, exige:

```bash
SISMO_SGC_PROVIDER=true
```

Atribución recomendada:

> Fuente: Servicio Geológico Colombiano (SGC), Red Sismológica Nacional de Colombia.
> Consultado [fecha y hora]. Estado: automático o manual.

Antes de activar, solicitar permiso a `radicacioncorrespondencia@sgc.gov.co` y
`datos@sgc.gov.co`. La solicitud debe nombrar expresamente ingestión automática, caché,
normalización, visualización pública, API y CLI.

## Fuentes oficiales

- [Portal de sismos del SGC](https://www.sgc.gov.co/sismos)
- [Catálogo sísmico](https://sgc.gov.co/catalogo)
- [Términos y condiciones](https://www2.sgc.gov.co/Paginas/terminos-y-condiciones.aspx)
- [Condiciones de propiedad intelectual](https://www2.sgc.gov.co/Nosotros/AcercaDelSgc/Documents/Condiciones-propiedad-intelectual-SGC.pdf)
- [Proceso de reporte de sismos](https://www2.sgc.gov.co/Noticias/Paginas/En-el-SGC-cumplimos-30-anos-monitoreando-sin-pausa-la-actividad-sismica-del-pais.aspx)
