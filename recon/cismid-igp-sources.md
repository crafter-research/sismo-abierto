# Recon: fuentes complementarias de terreno/suelo/vulnerabilidad sismica peruana

Fecha: 2026-08-18/19. Alcance: fuentes NUEVAS sobre terreno/suelo/vulnerabilidad, complementarias a lo que sismo-abierto ya consume (IGP eventos, SGC Colombia, USGS). Todo lo listado abajo fue tocado directamente (curl/pdfinfo/WFS/ArcGIS REST); nada se afirma sin observacion.

## Resumen ejecutivo

El hallazgo mas fuerte no es CISMID, es **IGP mismo**: mas alla del feed de sismos que sismo-abierto ya consume, IGP corre un GeoServer WFS publico en `ide.igp.gob.pe` con capas de **zonificacion sismica-geotecnica, capacidad portante, geologia, geomorfologia y sacudimiento sismico teorico (PGA)** para ~57 ciudades del Peru, en GeoJSON, sin token, con `Fees: NONE` y `AccessConstraints: NONE` declarados en su propio `GetCapabilities`. Es la fuente mas directamente consumible de todo el recon.

CISMID, en cambio, resulto mas pobre de lo que el nombre sugiere: solo publica dos PDFs de mapa (uno vectorial con leyenda completa Zona I-V, el otro sin texto legible de licencia/autoria), no corre servicios GIS propios, y su sitio WordPress tiene senales de spam SEO inyectado. Tiene un Laboratorio de Geomatica real con contacto institucional (`geomatica.cismid@uni.edu.pe`), que es el canal a usar para pedir datos formalmente.

INGEMMET GEOCATMIN confirma capas de suelos (`SERV_ESTUDIO_SUELO`) y geologia ambiental via ArcGIS REST, sin token visible en la exploracion de metadata (falta probar query real de features). MVCS tiene un portal GIS (GeoVivienda) pero su backend ArcGIS esta detras de un WAF que bloquea el probe automatizado. El catalogo nacional GEOIDEP confirma independientemente que "IDE IGP" es un geoportal oficial listado como DISPONIBLE — corrobora que el WFS de IGP no es un endpoint suelto sino un servicio sancionado.

## CISMID (datos + contacto institucional)

**Sitio**: `https://www.cismid.uni.edu.pe/` responde 200. Confirmado 2026-06/07 (pre-existente a este recon) y re-confirmado aqui.

**No corre ArcGIS/GeoServer propio.** `/arcgis/rest/services?f=json` devuelve 301 a Cloudflare (ya verificado antes de este recon, no re-testeado).

**Publica solo dos PDFs de mapa** (ver seccion siguiente para caracterizacion tecnica):
- `Mapa_Microzonificacion.pdf` — 22.9MB, vectorial, Lima+Callao, actualizado 2025/2026.
- `R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf` — 5.7MB, generado en ArcMap 10.8.1 (2022-02-26), Lima Metropolitana.

**Estructura institucional relevante** (mapeada desde el menu del sitio):
- Laboratorio Geotecnico — `https://www.cismid.uni.edu.pe/laboratorio-geotecnico/`
- Dpto. de Ing. Sismica > Lab. de Geomatica:
  - Miembros: `https://www.cismid.uni.edu.pe/dpto-de-ing-sismica/miembros-del-lab-de-geomatica/`
  - Proyectos de investigacion: `https://www.cismid.uni.edu.pe/dpto-de-ing-sismica/proyectos-de-investigacion-lab-de-geomatica/` (pagina viva, `datePublished: 2025-08-12`, pero el HTML devuelto en este recon fue solo el `<head>`/JSON-LD; no se extrajo listado de proyectos con datasets — **necesita revision manual con navegador**, la extraccion por curl no renderiza el contenido de body que probablemente carga con JS/theme).
- CEOIS (Centro de Estudios y Observatorio de la Ingenieria Sismorresistente): `https://www.cismid.uni.edu.pe/ceois-1/`, con submenu REDACIS: `https://www.cismid.uni.edu.pe/ceois/redacis/red` (link legado `http://` sin forzar HTTPS, no probado en detalle).

**Contactos institucionales encontrados en `/contacto/`** (pagina 200, emails extraidos literalmente del HTML):
- `geomatica.cismid@uni.edu.pe` — Lab. de Geomatica, el canal mas directo para pedir datos de microzonificacion/terreno.
- `labgeoc@uni.edu.pe` — Laboratorio Geotecnico.
- `dpmd.cismid@uni.edu.pe` — Dpto. de Planeamiento.
- `director@uni.edu.pe`, `ceois@uni.edu.pe`, `lab-estructuras@uni.edu.pe`, `mesadepartes_cismid@uni.edu.pe`, `tic.cismid@uni.edu.pe`.

No se encontro formulario web de solicitud de datos (solo mailto:). No se encontro repositorio institucional UNI con datasets/shapefiles/tesis descargables en la exploracion superficial — **necesita verificacion**: buscar en el repositorio institucional UNI (`repositorio.uni.edu.pe`, no probado) por tesis del Lab. de Geomatica con datos suplementarios.

**Riesgo de sitio comprometido**: confirmado antes de este recon (spam SEO/casino inyectado en el WordPress). No se re-verifico en esta pasada; anotarlo como riesgo persistente, no bloqueante para leer PDFs publicos.

## Caracterizacion de los PDFs

### Mapa_Microzonificacion.pdf (descargado a scratchpad, 22,935,249 bytes, HTTP 200, `Last-Modified` reportado previamente 13 ago 2026)

- **Formato**: vectorial con texto embebido, NO un raster escaneado. `pdfinfo` confirma `Creator: Esri ArcGISPro 3.6.3.59530`, `CreationDate: 2026-08-12`, 1 pagina tamano A1 (1683.84 x 2384.04 pts).
- **Fuentes embebidas** (via `pdffonts`): 7 fuentes TrueType/CID (SegoeUI, Arial-BoldMT, TimesNewRomanPS-BoldMT, TimesNewRomanPSMT, ArialMT, Tahoma-Bold, Arial-Black), todas embebidas y subseteadas — consistente con texto real, no imagenes de texto.
- **Imagenes embebidas** (via `pdfimages -list`): 14 imagenes, la mayoria JPEG de resolucion media (3173x660 px @150ppi, algunas mas), mas algunas capas de mayor resolucion (hasta 2048x2048 @1720ppi) — son el basemap satelital y overlays raster, no el mapa completo rasterizado.
- **Texto extraido** (`pdftotext -layout`, 139 lineas): confirma que el mapa trae **leyenda completa de Zonas I-V** con descripcion textual de cada zona:
  - ZONA I: afloramiento de roca, grava/arena densa a muy densa, limos/arcillas consistencia media a rigida. Periodos de vibracion <0.30s.
  - ZONA II: arena compacidad media a densa, arcillas/limos consistencia media. Periodos <0.40s.
  - ZONA III: arena suelta a media, limos/arcillas blanda a media. Periodos >0.40s.
  - ZONA IV: taludes inestables, canteras informales, suelos pantanosos, arenas eolicas sueltas potencialmente licuables, alta amplificacion sismica.
  - ZONA V: escombros/desechos, rellenos antropicos en excavaciones mineras.
  - Ademas trae capas de referencia: Rio, Limite Distrital, Zona Arqueologica, Otros Usos (OU), Zona Ecologica (ZE), Zona Estudio de Tratamiento Ambiental (ZETA) — estas ultimas tres citadas con fuente "Plan de Desarrollo Urbano Provincia Constitucional del Callao 2011-2022".
- **Autoria/creditos** (texto literal extraido del PDF): "UNIVERSIDAD NACIONAL DE INGENIERIA / FACULTAD DE INGENIERIA CIVIL / CENTRO PERUANO JAPONES DE INVESTIGACIONES SISMICAS Y MITIGACION DE DESASTRES" + titulo "MAPA DE MICROZONIFICACION SISMICA DE LA CIUDAD DE LIMA ACTUALIZADO AL 2025" + credito del basemap "Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community" + firma "Vantor" (proveedor de imagenes satelitales, aparece como marca en la esquina).
- **Licencia**: NO se encontro texto de licencia explicita (CC-BY, dominio publico, etc.) en el PDF. Solo el credito institucional arriba. **Necesita verificacion**: no hay clausula de reuso/redistribucion visible en el documento mismo.
- **Cobertura**: coordenadas UTM en el mapa van de 250000-320000 E y 8600000-8710000 N (zona 18S), y los distritos etiquetados cubren Lima Metropolitana + Callao completo: Ancon, Carabayllo, Santa Rosa, Puente Piedra, Ventanilla, Comas, San Juan de Lurigancho, Lurigancho, Chaclacayo, Callao, San Martin de Porres, Ate Vitarte, Lima, Cieneguilla, La Molina, San Isidro, San Borja, Villa Maria del Triunfo, Pachacamac, Chorrillos, Villa el Salvador, Lurin, Punta Hermosa, Punta Negra, San Bartolo, Santa Maria del Mar, Pucusana. **NO cubre otras regiones del Peru** — es exclusivamente Lima Metropolitana + Callao.

### R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf (descargado, 5,765,885 bytes, HTTP 200)

- **Formato**: tambien vectorial (`Creator: Esri ArcMap 10.8.1.14362`, `CreationDate: 2022-02-26`), 1 pagina A1, con 6 fuentes TrueType embebidas (incluye `ESRINorth`, fuente tipica de simbolos cartograficos ESRI).
- **Texto extraido**: solo se recuperaron etiquetas de distritos y coordenadas UTM (mismo cuadrante que el mapa anterior: 250000-320000E). **No se encontro texto de leyenda, autoria, ni licencia** via `pdftotext` — la mayor parte del contenido tematico (leyenda de riesgo, creditos) probablemente esta compuesta con simbolos/graficos vectoriales sin capa de texto extraible por esa herramienta, o usa la fuente ESRINorth para simbolos en vez de glifos de texto estandar. **Necesita verificacion visual** (screenshot/render) para confirmar contenido de leyenda; `pdftotext` no es suficiente para este archivo.
- **Cobertura**: mismo cuadrante UTM que el mapa de microzonificacion — Lima Metropolitana, sin indicios de cobertura mas alla.

## IGP mas alla de eventos sismicos

**Contexto de conectividad**: `ide.igp.gob.pe/geoserver/ows?service=wfs&version=2.0.0&request=GetCapabilities` respondio **HTTP 200, 297KB**, sin timeout, en esta sesion. Esto **contradice** el reporte previo de TCP timeout desde Argentina para ese mismo host — o la condicion de red cambio, o el path especifico (`/geoserver/ows`) responde distinto al que se probo antes. Anotarlo: **no reafirmar "geo-bloqueado" sin re-probar**; en esta sesion el servicio estuvo alcanzable sin proxy.

`ide.igp.gob.pe/geoserver/web/` (la consola admin) SI devolvio 302 (probablemente a login), consistente con que la interfaz web esta protegida pero el servicio OWS/WFS de datos es publico.

### GetCapabilities: contacto y terminos declarados

El propio `GetCapabilities` del WFS trae metadata de servicio:
- `ows:Fees`: **NONE**
- `ows:AccessConstraints`: **NONE**
- `ows:ProviderName`: Instituto Geofisico del Peru
- Contacto declarado: **Jhomira Loja Zumaeta**, Analista de Sistemas GIS, `jloja@igp.gob.pe`, La Molina 15023, Lima 12, Peru.

Esto es evidencia directa (no interpretada) de que el servicio se declara de acceso libre y sin costo, con un contacto humano nombrado para consultas.

### Namespaces/capas disponibles (404 `<Name>` entries totales en el WFS, confirmado por conteo)

Namespaces relevantes a terreno/suelo/vulnerabilidad (no sismicidad de eventos):
- **`CapacidadPortante`** — capacidad portante del suelo. Tabla nacional `capacidad_portante` con **174 features**, campos: `tipo` (ej. "Muy Baja", "Baja", "Media"), `capac_port` (rango en kg/cm2, ej. "< 1 kg/cm2", "1 - 2 kg/cm2"), `ciudad`, `departamento`, `fecha` (año del estudio, va de ~2012 a ~2019), `st_area_sh`, `st_length_`. Confirmado con `GetFeature` real (muestra de 5 features: Cañete/LIMA, Tambo Grande/PIURA, Chosica/LIMA, Carapongo/LIMA, Chaclacayo/LIMA). Ademas hay ~57 sub-capas por ciudad individual (`cap_por_acari`, `cap_por_arequipa`, etc.) que parecen ser las mismas geometrias particionadas por ciudad.
- **`ZonificacionSismica`** — zonificacion sismica-geotecnica. Tabla nacional `zonificacion_sismica` con **544 features**, campos: `ciudad`, `departamento`, `fecha`, `zona` (texto descriptivo, ej. "Suelo Tipo S1 - 2: Rigido (0.2 - 0.3 seg.)", "Suelo Tipo S2 - 2: Medianamente rigido (0.4 - 0.5 seg.)"), `st_area_sh`, `st_length_`. Confirmado con `GetFeature` real (San Luis/LIMA, Paita/PIURA, Alto de la Alianza/TACNA). Tambien ~57 sub-capas por ciudad (`zon_acari`, `zon_arequipa`, etc.).
- **`Suelos`** — tipos de suelo, ~57 capas por ciudad (`suelos_acari`...`suelos_yauca`) mas tabla base `suelos`. No se probo `GetFeature` de esta especifica (misma estructura de namespace esperada que las anteriores, por analogia).
- **`Geologia`** — geologia, misma estructura (~57 capas por ciudad + tabla base). No probado en detalle.
- **`Geomorfologia`** — geomorfologia, misma estructura (~57 capas por ciudad + tabla base). No probado en detalle.
- **`Geodinamica`** — geodinamica (peligros geodinamicos: deslizamientos, etc.), misma estructura por ciudad. No probado en detalle.
- **`PGA`** — `PGA:Sacudimiento_teorico`, campos confirmados via `DescribeFeatureType`: `the_geom`, `value`, `units`, `color`, `weight`, `eventid`. Esto es aceleracion pico del suelo (sacudimiento teorico), asociado a un evento (`eventid`) — puede ser modelado post-sismo en vez de un mapa estatico de peligro.
- **`SacudimientoSuelo`** — `SacudimientoSuelo:Sacudimiento`, no se probo `DescribeFeatureType` en detalle.
- **`MapaSacudimientoTeorico`** — dos capas `pgashape_01`, `pgashape_02`, no probadas en detalle.

Las ~57 ciudades que se repiten en todos estos namespaces (Acari, Alto de la Alianza, Arena, Arequipa, Asia, Barranca, Bella Union, Boca del Rio, Camana, Carapongo, Casma, Castilla, Catacaos, Cañete, Cerro Azul, Chaclacayo, Chala, Chancay, Chilca, Chimbote, Chosica, Chulucanas, Ciudad Nueva, Coayllo, Cocachacra, Huacho, Huaral, Huarmey, Huaycan, Humay, Ilo, Imperial, Ite, Lomas, Lunahuana, Mala, Mancora, Moquegua, Morropon, Nuevo Chimbote, Nuevo Imperial, Paita, Piura, Punta Bombon, Querecotillo, Quilmana, San Antonio, San Clemente, San Luis, Sechura, Sullana, Tacna, Talara, Tambo Grande, Torata, Union, Yauca) sugieren un programa nacional de microzonificacion urbana de IGP, cubriendo costa centro y norte principalmente, mas Tacna/Moquegua al sur.

### Pagina institucional IDE-IGP

`https://www.igp.gob.pe/servicios/infraestructura-de-datos-espaciales/` responde 200 pero el HTML devuelto via curl esta vacio de contenido real ("We're sorry but pi-theme doesn't work properly without JavaScript enabled") — el sitio requiere JS para renderizar. **Necesita verificacion con navegador** (agent-browser) para leer el contenido real de esta pagina, que probablemente documenta los servicios OWS disponibles y su politica de uso en prosa.

### IGP en el catalogo nacional GEOIDEP

El catalogo GEOIDEP (`https://www.geoidep.gob.pe/catalogo-nacional-de-servicios-web/geoportales`) **lista a IGP como entidad con geoportal DISPONIBLE**, entrada "IDE IGP", descripcion "Mostrar la informacion generada por el Instituto Geofisico del Peru e impulsar los estudios y/o productos que se derivan de estos", recurso apuntando a `https://www.igp.gob.pe/...` (URL truncada en el extracto, no capturada completa). Esto corrobora independientemente (fuente = Estado peruano, no IGP mismo) que el servicio es oficial y sancionado, no un endpoint de desarrollo olvidado.

## Otras instituciones peruanas con dato de terreno

### INGEMMET GEOCATMIN — vivo, con capas de suelo/geologia ambiental

- `https://geocatmin.ingemmet.gob.pe/geocatmin/` — HTTP 200.
- `https://geocatmin.ingemmet.gob.pe/arcgis/rest/services?f=json` — HTTP 200, ArcGIS Server 10.91. Enumeracion completa de carpetas: `BDGEOCIENTIFICA`, `DGAR`, `DGR`, `DRME`, `GEOCATMIN_SOCIAL`, `GEOPROCESO`, `Hosted`, `INTRANET`, `PRODUCTO_SATELITAL`, `pruebas`, `Utilities`, `WGS84`, `WGS84_17`, `WGS84_18`, `WGS84_19`.
- Servicios de nivel raiz relevantes confirmados en el listado JSON (parcial, la respuesta se corto en la captura pero incluyo lo visible):
  - **`SERV_ESTUDIO_SUELO`** (MapServer) — confirmado con detalle: capa "Cuenca Rio Tambo" y "Cuenca San Lorenzo", tipo Feature Layer, geometria poligono, con `documentInfo.Keywords: "SERV_ESTUDIO_SUELO,MapServer,suelos,estudio"`. Renderer con clasificacion por `RULEID` (tipos de suelo con codigos como A1, AL-ok-loe, AR-ca.je, AR-so-rp — nomenclatura de clasificacion edafologica). Cobertura: extent nacional aproximado (xmin -87.28 a xmax -62.17, todo el Peru), pero las dos capas confirmadas son cuencas especificas (Tambo, San Lorenzo) — **necesita verificacion** si hay mas capas de suelo bajo este servicio a nivel nacional o si es solo estas dos cuencas.
  - **`SERV_GEOLOGIA_AMBIENTAL`** (MapServer) — confirmado con detalle: "Linea Base Ambiental", copyright "INGEMMET", con sub-capas "Tipo de fuente", "Temporada", "Subcuencas", "Serie N - Linea Base Ambiental", y grupo "Criosfera y cambio climatico" > "Evolucion Glacial". Extent: xmin -74.44 a xmax -68.93, ymin -17.49 a ymax -12.62 — cubre sur del Peru (Arequipa/Moquegua/Tacna/Puno aprox). No es estrictamente sismico pero es dato geoambiental/de terreno.
  - Otros servicios visibles en el listado (no explorados en detalle, solo enumerados): `SERV_GEOLOGIA_100K_INTEGRADA`, `SERV_GEOLOGIA_50K_INTEGRADA`, `SERV_GEOLOGIA_REGIONAL`, `SERV_GEOMORFOLOGIA`, `SERV_GEOFISICA`, `SERV_CARTOGRAFIA_BASE_WGS84`, `SERV_AEROMAGNETIICO` (ImageServer), `SERV_ANOMALIA_ESPECTRAL`, entre otros geologicos/geofisicos que podrian tener relevancia geotecnica indirecta pero no fueron probados individualmente.
- **Auth**: no se encontro requerimiento de token en la metadata explorada (`?f=json` respondio sin error de auth). **Necesita verificacion**: no se probo una query real de features (`/query`) para confirmar que devuelve datos sin autenticacion — la exploracion de metadata puede ser publica mientras la descarga de datos exige token, como paso con SIGRID/CENEPRED (ver abajo).
- No se encontro pagina de terminos/licencia especifica de GEOCATMIN en esta pasada (`https://www.ingemmet.gob.pe/geocatmin` fallo con connection error/timeout — **necesita re-intento**).

### MVCS (Ministerio de Vivienda) — geoportal con GIS restringido

- `https://geo.vivienda.gob.pe/` (GeoVivienda) — HTTP 200, contenido renderizado confirma: "Plataforma GIS del Ministerio de Vivienda, Construccion y Saneamiento", aprobada por R.M. N° 087-2019-VIVIENDA, requiere **login** ("Ingresar" en el menu) para acceder a datos reales.
- `http://geo.vivienda.gob.pe/arcgis/rest/services?f=json` — **HTTP 418**, bloqueado por un WAF que devuelve pagina en chino ("访问被拦截" = "acceso bloqueado", CloudWAF). Esto es un bloqueo de firewall al patron de request automatizado, no necesariamente ausencia del servicio. **Necesita verificacion con navegador** (headers/UA distintos, o browsing real) para confirmar si el ArcGIS REST existe detras del WAF.
- `https://sspfront.vivienda.gob.pe/Mapa/MRiesgo/Index` — HTTP 200, pero el contenido confirma que es el **"Mapa de Obras por Transferencia 2018"** (Ley 30556, nucleos ejecutores de reconstruccion), NO un mapa de riesgo sismico/geotecnico. **Descartado como fuente relevante** — el nombre "MRiesgo" es enganoso, es sobre proyectos de inversion/reconstruccion, no peligro.

### GEOIDEP / Catalogo Nacional (PCM) — meta-catalogo, no fuente primaria

- `https://www.geoidep.gob.pe/` — HTTP 200, es el **catalogo nacional de geoportales, visores, servicios OGC (WMS/WFS/WMTS), servicios REST:ArcGIS, y metadatos** del Estado peruano. 18 geoportales institucionales, +2536 servicios de mapas, +150 visores registrados.
- Utilidad para el proyecto: es el mejor punto de partida para descubrir NUEVAS fuentes institucionales de forma sistematica (confirma que IGP esta ahi; INGEMMET tambien deberia estar aunque no se confirmo su entrada especifica en el extracto capturado — **necesita verificacion**, la lista se corto en "18 Resultados encontrados" con solo unos pocos extraidos: MIDAGRI (en mantenimiento), GEOSERFOR, OEFA-PIFA, y IGP).
- Enlaces oficiales relacionados descubiertos: `https://visor.geoperu.gob.pe/` (visor de GeoPeru), `https://catalogo.geoidep.gob.pe/metadatos` (portal de metadatos nacional).
- `https://www.geoperu.gob.pe/` — HTTP 200 (redirige 301 desde no-www), es la "Plataforma Nacional de Datos Georreferenciados", integradora de capas de entidades del Estado con enfoque territorial. No se probo si tiene capas sismicas/geotecnicas propias vs. solo redirige a las fuentes originales (IGP, INGEMMET, etc.) — **necesita verificacion**.

### CENEPRED SIGRID — confirmado auth-gated (evidencia pre-existente en scratchpad, re-confirmada)

El scratchpad ya contenia artefactos de una sesion previa con agent-browser (`sigrid-01.png`, `sigrid-02-viewer.png`, `sigrid-03-mapa.png`, `sigrid.har`, y varios `.json` de respuestas de API) apuntando a `sigrid.cenepred.gob.pe`. Los JSON capturados muestran **errores de token consistentes**:
- `{"error":{"code":498,"message":"Invalid Token"}}` — para `Cartografia_Peligros`, `Cartografia_Riesgos`, `Informacion_CENEPRED`, `Informacion_Complementaria`, `prevaed`, `sigrid_collect`.
- `{"error":{"code":499,"message":"Token Required"}}` — para `infocenepred`, `infocomp`, `peligros`, `riesgos`.

Confirma con evidencia directa (no solo inferencia del nombre del proyecto): **SIGRID/CENEPRED requiere autenticacion para descarga de capas de peligro/riesgo**, consistente con que sismo-abierto ya usa CENEPRED via otra via (segun contexto del proyecto) y no es una fuente nueva accesible sin permiso.

### INDECI — no alcanzable con lo probado

`https://www.indeci.gob.pe/` — **NXDOMAIN** (`nslookup` confirma "server can't find www.indeci.gob.pe"). No es un 404 ni timeout, es fallo de resolucion DNS. Probado `https://www.gob.pe/indeci` como alternativa — HTTP 200, pero no se exploro el contenido (portal generico gob.pe, no un geoportal directo). **No alcanzable con lo probado**: dominio propio `indeci.gob.pe` no resuelve; no se identifico un geoportal INDECI especifico.

### IMP (Instituto Metropolitano de Planificacion, Lima) — parcialmente alcanzable

`https://www.imp.gob.pe/` — el DNS SI resuelve (`www.imp.gob.pe` → `45.236.45.131`, confirmado por `nslookup`) pero el `curl` fallo con exit code 6/000 en el segundo intento (posible timeout o filtro especifico a ese IP, no DNS). `geo.imp.gob.pe` (subdominio geoportal esperado) — **NXDOMAIN confirmado**, no existe ese subdominio. `https://www.gob.pe/imp` — HTTP 200 (portal generico). **No alcanzable con lo probado**: el dominio principal resuelve pero no respondio consistentemente al connect; no se encontro subdominio geoportal.

### SENCICO — resuelve pero no explorado

`sencico.gob.pe` resuelve por DNS (`181.65.255.149`) y `https://www.gob.pe/sencico` respondio HTTP 200. SENCICO es el organismo que administra la norma sismorresistente E.030 — potencialmente relevante para parametros de zonificacion sismica normativa (Z, S, Tp, Tl por zona), pero **no se exploro su sitio ni se busco geoportal propio** en esta pasada. Queda pendiente.

## Datos abiertos (datosabiertos.gob.pe)

- `https://www.datosabiertos.gob.pe/` — HTTP 200, confirmado como Drupal 7 (`Generator: Drupal 7`), plataforma "Marco de Gobernanza de Datos del Estado Peruano".
- La API CKAN estandar (`/api/3/action/package_search`) **devuelve 404** — no expone la API REST de CKAN en ese path, o usa una implementacion Drupal-nativa distinta (no CKAN).
- Busqueda vista via UI (`/search?query=microzonificacion`) devolvio pagina 200 con **"No results were found. Please try another keyword."** — busqueda real ejecutada, cero resultados para "microzonificacion" especificamente. **No se probaron otros terminos** ("peligro sismico", "suelos", "vulnerabilidad", "zonificacion sismica") — **necesita verificacion** con esos terminos alternativos antes de concluir que no hay datasets relevantes en esta plataforma.
- No se encontraron datasets de microzonificacion/peligro sismico/suelos en la unica busqueda realizada.

## Licencias por fuente (texto literal donde se encontro)

| Fuente | Licencia/terminos encontrados | Evidencia |
|---|---|---|
| IGP WFS (`ide.igp.gob.pe`) | `ows:Fees: NONE`, `ows:AccessConstraints: NONE` (declarado en el propio GetCapabilities del servicio) | XML de GetCapabilities, seccion `ServiceIdentification` |
| CISMID PDFs | Ninguna clausula de licencia encontrada en el texto extraible del PDF. Solo credito institucional (UNI/CISMID) y credito de basemap (Esri/Maxar/Earthstar/Vantor) | `pdftotext` de ambos PDFs |
| INGEMMET GEOCATMIN | No encontrada en esta pasada (pagina de terminos no cargo) | Ninguna — **necesita verificacion** |
| MVCS GeoVivienda | "Copyright © 2026 · Ministerio de Vivienda, Construccion y Saneamiento — Todos los derechos reservados" (footer del sitio, sin detalle de terminos de reuso de datos) | HTML de `geo.vivienda.gob.pe` |
| datosabiertos.gob.pe | Marco de Gobernanza de Datos del Estado (generico, no licencia por dataset) — sin datasets encontrados en la busqueda realizada | HTML de home |
| CENEPRED SIGRID | Implicita: acceso requiere token (no hay licencia de reuso libre visible sin autenticarse) | JSON de error 498/499 en scratchpad |

## Necesita verificacion

- Contenido real (renderizado con JS) de `https://www.igp.gob.pe/servicios/infraestructura-de-datos-espaciales/` — probablemente documenta politica de uso en prosa.
- Contenido real de la pagina de proyectos del Lab. de Geomatica CISMID (`/dpto-de-ing-sismica/proyectos-de-investigacion-lab-de-geomatica/`) — el body no se extrajo via curl.
- Repositorio institucional UNI (`repositorio.uni.edu.pe`, no probado) por tesis/datasets del Lab. de Geomatica o Geotecnico.
- Query real (no solo metadata) de `SERV_ESTUDIO_SUELO` y `SERV_GEOLOGIA_AMBIENTAL` de GEOCATMIN para confirmar si exige token en la descarga de features (la exploracion `?f=json` de metadata respondio libre, pero eso no garantiza que `/query` tambien lo sea).
- Pagina de terminos/licencia de INGEMMET GEOCATMIN (`ingemmet.gob.pe/geocatmin` fallo con timeout).
- ArcGIS REST de MVCS detras del WAF (`geo.vivienda.gob.pe/arcgis/rest/services`) — probar con navegador real via agent-browser en vez de curl.
- Contenido completo del listado de 18 geoportales en GEOIDEP (solo se capturaron 4-5 entradas del extracto de texto).
- Busquedas alternativas en `datosabiertos.gob.pe` con terminos distintos a "microzonificacion" ("peligro sismico", "suelos", "vulnerabilidad", "zonificacion").
- Suelos, Geologia, Geomorfologia, Geodinamica del WFS de IGP — se confirmo la existencia de las capas y su schema por analogia con CapacidadPortante/ZonificacionSismica, pero no se corrio `GetFeature` real sobre estas cuatro especificamente.
- `SENCICO` — no explorado en absoluto mas alla de confirmar que resuelve.
- `INDECI` — dominio propio no resuelve; falta encontrar si tiene geoportal bajo otro dominio.
- `IMP` (Lima) — dominio resuelve pero no cargo consistentemente; no se confirmo si tiene geoportal.

## Veredicto por fuente

| Fuente | Veredicto | Notas |
|---|---|---|
| **IGP WFS `ide.igp.gob.pe`** (ZonificacionSismica, CapacidadPortante, Suelos, Geologia, Geomorfologia, Geodinamica, PGA) | **Consumible ya** | GeoJSON via WFS, sin token, `Fees: NONE`/`AccessConstraints: NONE` declarado por el servicio, corroborado por catalogo nacional GEOIDEP. Fuente mas fuerte de este recon. |
| CISMID `Mapa_Microzonificacion.pdf` | **Requiere permiso / trabajo manual** | PDF vectorial descargable libremente, contenido rico (leyenda Zona I-V, Lima+Callao), pero sin licencia explicita de reuso — pedir permiso formal via `geomatica.cismid@uni.edu.pe` antes de extraer geometrias. No es un feed, es un mapa estatico A1. |
| CISMID `R01_RIESGO_SISMICO_LIMA.pdf` | **Requiere verificacion visual + permiso** | Descargable, pero contenido de leyenda no extraible por texto; y sin licencia visible. Mismo canal de contacto que arriba. |
| CISMID Lab. de Geomatica (proyectos, datasets, tesis) | **No alcanzable con lo probado** | Pagina existe pero no se pudo leer contenido real via curl (requiere JS o navegador); repositorio UNI no probado. |
| INGEMMET GEOCATMIN `SERV_ESTUDIO_SUELO`, `SERV_GEOLOGIA_AMBIENTAL` | **Requiere verificacion** (probable consumible) | Metadata publica sin token visible; falta confirmar que la descarga real de features tambien es libre. |
| MVCS GeoVivienda / ArcGIS | **Requiere permiso (login) + bloqueado por WAF al probe automatizado** | El portal exige login para datos; el REST API esta detras de un WAF que bloqueo el request automatizado (418). |
| MVCS `sspfront/Mapa/MRiesgo` | **Descartado** | No es sobre riesgo sismico, es sobre obras de reconstruccion post-Fenomeno El Niño (Ley 30556). |
| GEOIDEP / GeoPeru (PCM) | **Consumible como catalogo/meta-fuente**, no como dato primario | Util para descubrir mas fuentes sistematicamente; no expone capas propias de terreno. |
| CENEPRED SIGRID | **Requiere permiso (auth)** | Confirmado con errores 498/499 en llamadas API reales (evidencia pre-existente en scratchpad). Ya conocido por el proyecto via otra via segun contexto. |
| datosabiertos.gob.pe | **No alcanzable con lo probado** | Busqueda real ejecutada para "microzonificacion" sin resultados; faltan mas terminos de busqueda antes de descartar. |
| INDECI | **No alcanzable con lo probado** | Dominio propio no resuelve (NXDOMAIN). |
| IMP (Lima) | **No alcanzable con lo probado** | Dominio resuelve pero conexion inconsistente; sin geoportal identificado. |
| SENCICO | **No alcanzable con lo probado** | Solo se confirmo que el dominio resuelve; no explorado. |

## Artefactos en scratchpad

`/private/tmp/claude-501/-Users-raillyhugo-hunter-brain/d40fc7b8-a9f3-43e4-99c8-5e4a940a7762/scratchpad/`:
- `Mapa_Microzonificacion.pdf` (22.9MB, descargado en este recon)
- `R01_RIESGO_SISMICO_LIMA.pdf` (5.7MB, descargado en este recon)
- `sigrid-*.png`, `sigrid.har`, `*.json` — artefactos pre-existentes de una sesion agent-browser anterior contra CENEPRED SIGRID (no generados por este recon, reutilizados como evidencia).

Nada de esto se copio al repo `sismo-abierto`, conforme a la regla de no pesado en git.
