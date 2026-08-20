# Recon

Reportes de reconocimiento sobre fuentes que el proyecto consume o evaluó consumir.
Cada uno responde una pregunta anterior a escribir código: **qué expone realmente
este servicio, y conviene construir sobre él.**

La regla que ordena todos: cada afirmación está observada con una petición real o
marcada como no verificada, con el paso que la confirmaría. Un reporte que adivina
sin decirlo cuesta un día al que lo lee.

## Índice

| Reporte | Fecha | Veredicto | Qué destrabó |
|---|---|---|---|
| [cismid-igp-sources](cismid-igp-sources.md) | 2026-08-18/19 · medido 2026-08-20 | **Construir** | El WFS abierto del IGP, hoy en producción |
| [sigrid-public-surface](sigrid-public-surface.md) | 2026-08-18 | Construir acotado | Qué de CENEPRED es público y qué no |
| [sigrid-visor-dataflow](sigrid-visor-dataflow.md) | 2026-08-19 | Bloqueado sin permiso | Cómo el visor acuña su token |
| [hazard-models](hazard-models-2026-08-19.md) | 2026-08-19 | Construir acotado | WMTS de OpenQuake, sin valores por punto |
| [indeci](indeci-2026-08-19.md) | 2026-08-19 | **No construir** | No existe dataset de zonas seguras |

`friction.md` acompaña a los reportes: recoge dónde el propio método falló, y es el
único insumo que mejora el skill de recon.

---

## 1. Fuentes de terreno peruanas · `cismid-igp-sources.md`

**La recon más rentable del proyecto.** Buscaba datos del CISMID y encontró que el
hallazgo estaba en otro lado: el IGP corre un **GeoServer WFS público** en
`ide.igp.gob.pe` con zonificación sísmica-geotécnica, capacidad portante, geología,
geomorfología y PGA teórico para ~57 ciudades, en GeoJSON, sin token, con
`Fees: NONE` y `AccessConstraints: NONE` declarados en su propio GetCapabilities.

Todo `packages/terrain` sale de ahí. La página `/terreno` existe por este reporte.

Lo que descartó, y ahorró tiempo: CISMID publica dos PDFs y no corre servicios GIS
propios. MVCS tiene su ArcGIS detrás de un WAF.

## 2. Superficie pública de SIGRID · `sigrid-public-surface.md`

Separa qué de CENEPRED es consumible de qué no. El catálogo REST de
`sig.cenepred.gob.pe` responde sin token para algunas carpetas, pero las seis capas
con la data de peligro devuelven `499 Token Required` de forma consistente.

Hallazgo lateral: hay FeatureServers públicos en ArcGIS Online que se autodenominan
microzonificación CISMID, con conteos que **no calzan** con los 658 polígonos de la
capa protegida. Son estudios distintos, no un espejo. Distinguir eso evitó publicar
un dataset como si fuera otro.

Ningún ítem declara `licenseInfo`. Ese vacío es un bloqueo real para republicar, no
una formalidad.

## 3. Flujo de datos del visor SIGRID · `sigrid-visor-dataflow.md`

Documenta el mecanismo, no lo automatiza. El backend Laravel **acuña un token
ArcGIS server-side** y lo embebe en el HTML; no hay request a `generateToken`. El
token solo sirve con el header `Referer` apuntando a `sigrid.cenepred.gob.pe`.

Ese detalle corrigió una premisa del usuario que parecía obvia. La suposición era
"mi IP ya está whitelisteada"; el servicio valida `Referer`, no IP, y un curl sin
ese header desde la misma IP devuelve `498`. Medirlo tomó 30 segundos y cambió la
decisión entera.

Es la base del permiso que CENEPRED terminó otorgando.

## 4. Modelos de amenaza · `hazard-models-2026-08-19.md`

Evalúa los tres recursos que propuso la comunidad. **Corrige la expectativa que
motivó el pedido**: OpenQuake tiene un WMTS público del Global Seismic Hazard Map
v2026.1 con `Fees: none`, pero su `GetFeatureInfo` devuelve 200 sin valor, porque
mapproxy cachea teselas y no reenvía el ráster.

Consecuencia: sirve como capa cartográfica, **no** para reemplazar la tasa base de
`/verifica` con probabilidad calibrada. Eso sigue bloqueado.

Descarta OpenEEW (es hardware, mitad de sus repos sin tocar desde 2021) y ubica
Clawpack como job offline, no como servicio.

## 5. INDECI y zonas seguras · `indeci-2026-08-19.md`

Responde la feature más pedida del hilo de la comunidad antes de construirla. La
Plataforma Nacional de Datos Abiertos devuelve **0 resultados** para "zonas
seguras", "refugio" y "evacuación".

Convierte una objeción de criterio en un hecho medido: sin catálogo oficial,
cualquier mapa de refugios sería inventado.

Hallazgo lateral útil: `Emergencias históricas registradas por INDECI` permite
contrastar sismos catalogados contra emergencias declaradas. Otra pregunta, y una
que el sitio sí puede responder.

---

## Cómo se lee un reporte

Cada uno tiene la misma forma:

1. **Veredicto** primero. Construir, construir acotado, o no construir.
2. **Tabla de endpoints** con lo observado, con estado y tamaño de respuesta.
3. **Bloqueos**, con qué los pasó o que nada lo hizo.
4. **Necesita verificación**, cada ítem con el paso que lo confirmaría.
5. **Riesgo de mantenimiento**, dicho sin suavizar.

Si un reporte afirma algo sin petición que lo respalde, es un bug del reporte.

## Convenciones

- Los HAR y las capturas **no van a git**: llevan tokens vivos. `.gitignore` cubre
  `recon/*.har` y `recon/*.png`.
- Un reporte no se actualiza en el lugar cuando el mundo cambia: se escribe uno
  nuevo con fecha. Los anteriores documentan qué era cierto cuando se decidió.
- La fecha en el nombre es del día de la observación, no del commit.
