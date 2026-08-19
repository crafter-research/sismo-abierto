# Recon · OpenQuake, Clawpack y OpenEEW

Fecha: 2026-08-19 · Objetivo: qué exponen realmente y qué se puede construir sobre
eso en sismo.crafter.run.

## Veredicto

**Construir, acotado: solo OpenQuake, y solo como capa cartográfica.**

De los tres recursos que propuso la comunidad, uno tiene superficie consumible hoy,
otro es una librería de cálculo que no se consume sino que se corre, y el tercero no
tiene datos sin desplegar hardware propio.

---

## 1. OpenQuake / GEM — hay superficie, verificada

Terreno B (API interna detrás de un visor). El visor es
`maps.openquake.org`, Django + Leaflet, sin login para los mapas públicos.

### Endpoints observados

| Petición | Estado | Resultado | Verificación |
|---|---|---|---|
| `GET /mapproxy/gshm-2026-06-04-nobg/wmts/1.0.0/WMTSCapabilities.xml` | 200 | 10.052 bytes de XML | observado |
| `GET /mapproxy/gshm-2026-06-04-nobg/wmts/v20260/webmercator/6/17/36.png` | 200 | `image/png`, 17.402 bytes | observado |
| `GET /map/gshm-v2026_1/` | 200 | visor del Global Seismic Hazard Map v2026.1 | observado |

### Lo que declaran las capabilities

- `ows:Fees: none` y `ows:AccessConstraints: none`, leído del propio XML.
- Dos versiones de capa: `v20231` y `v20260`. La segunda es el modelo 2026.
- Un solo TileMatrixSet: `webmercator`. Zoom 0 a 19.
- Formato único: `image/png`.

Es la misma forma de licencia abierta que ya verificamos en el WFS del IGP, y
declarada en el servicio, no en una página de términos aparte.

### Qué habilita

Mostrar la amenaza sísmica de referencia como capa bajo un evento o bajo la capa de
terreno: contexto visual citable, de una organización establecida, con licencia
abierta declarada en el servicio.

### Lo que NO resuelve

Un WMTS sirve **imágenes**, no valores. La idea original era reemplazar la tasa base
de `/verifica` por una probabilidad calibrada del modelo, y eso **no se puede con
este servicio**: hace falta el dato numérico por punto, que está en los archivos del
`oq-engine`, no en las teselas.

### El WMS existe, pero no devuelve valores

Probado después de escribir la sección anterior:

| Petición | Estado | Resultado |
|---|---|---|
| `GET /service?service=WMS&request=GetCapabilities` | 200 | 5.189 bytes, declara `GetMap` y `GetFeatureInfo` |
| `GET /service?...request=GetFeatureInfo&layers=v20260&info_format=text/plain` sobre Lima | 200 | **40 bytes: `GetFeatureInfo results` + `Layer 'v20260'`, sin valor** |

Las capabilities anuncian `GetFeatureInfo` y también declaran `Fees: none` /
`AccessConstraints: none`. Pero mapproxy actúa de caché de teselas frente al
servicio original, y no reenvía el valor del ráster: la respuesta llega vacía de
dato.

**Consecuencia para el diseño**: lo consumible es cartografía, no números. Sirve
para mostrar el contexto de amenaza junto a un evento, no para reemplazar la tasa
base de `/verifica` con una probabilidad calibrada. Esa parte sigue necesitando los
archivos del modelo.

### Necesita verificación

- Si el modelo de Sudamérica (SAM) está disponible como archivo descargable, que es
  lo que sí permitiría calcular valores. La búsqueda de repos `gem/mosaic` dio 404 y
  la búsqueda por `south america` no devolvió nada. **Paso**: revisar
  `hazard.openquake.org` o pedirlo por la vía del proyecto.
- Si el servicio original detrás del mapproxy expone `GetFeatureInfo` con valor.
  **Paso**: leer `<OnlineResource>` de las capabilities del WMS y consultarlo
  directamente.
- Límite de tasa: no observado, no medido. Se hicieron 6 peticiones en total.

---

## 2. Clawpack / GeoClaw — es una librería, no un servicio

Terreno F (sin backend). Verificado:

- Repo `clawpack/clawpack`: 209 estrellas, Python, BSD-3-Clause, último push
  2026-07-30. Vivo y mantenido.
- Publicado en PyPI: versión `5.14.0`, requiere Python >= 3.6.
- Descripción: "Package for solving hyperbolic systems of partial differential
  equations".

No hay API que consumir. GeoClaw es un solver que corre sobre una malla adaptativa;
el trabajo es preparar batimetría y condiciones iniciales, correrlo, y publicar el
resultado. Es Fortran compilado bajo una fachada Python.

**Cómo entraría**: como job offline que precomputa escenarios y deja GeoJSON o
teselas, nunca como cálculo por request. Eso es un proyecto propio con su propio
ciclo, no un slice del sitio.

**Precondición**: tener resuelto el mapa de impacto por tipo de suelo. Simular
propagación sin eso es empezar por el techo.

---

## 3. OpenEEW — no hay datos sin hardware propio

Verificado sobre los 20 repos de la organización:

| Repo | Último push | Qué es |
|---|---|---|
| `openeew` | 2024-05-10 | introducción al proyecto |
| `openeew-sensor` | 2025-08-21 | **hardware** del sensor |
| `openeew-firmware` | 2026-03-18 | firmware del sensor |
| `openeew-dashboard` | 2021-11-03 | dashboard de dispositivos |
| `openeew-python` | 2021-09-02 | herramientas para datos **propios** |
| `openeew-nodered` | 2021-04-09 | flujos de detección |

El proyecto es una red de sensores que uno fabrica y despliega, no un feed. La
mitad de los repos no se toca desde 2021. `openeew-python` no tiene README
accesible en `main` ni `master` (404 en ambos).

**No entra.** Y por encima del argumento técnico está el de responsabilidad: Perú
ya tiene SISMATE como canal oficial de alerta. Competir con el canal de emergencia
desde un proyecto sin turnos ni SLA es irresponsable, independientemente de si la
tecnología existe.

---

## Lo que ya tenemos y no hay que volver a pedir

Durante la recon quedó claro que dos insumos de las ideas más pedidas ya están
construidos:

- `igp-aceldat`: Red Acelerométrica Nacional del IGP, ya integrada como fuente.
- `packages/terrain`: zonificación y capacidad portante de 57 ciudades, con
  `bearing-capacity.ts`, `zonification.ts` y `map-data.ts`.

El mapa de impacto por tipo de suelo no arranca de cero: arranca de interpolar
entre estaciones que ya consultamos, sobre un terreno que ya tenemos.

---

## Riesgo de mantenimiento

El WMTS de OpenQuake es un servicio de una organización establecida con licencia
abierta declarada, y la ruta incluye una fecha (`gshm-2026-06-04-nobg`), lo que
sugiere que cada publicación del modelo crea una ruta nueva. **Eso significa que la
URL va a cambiar cuando salga el modelo siguiente.** No es un endpoint sin contrato
como los que vimos en portales del Estado, pero tampoco es una API versionada con
política de deprecación.

Mitigación: leer la ruta de las capabilities en vez de hardcodearla, y monitorearla
con el mismo `check-source-drift.ts` que ya cubre las otras nueve fuentes.
