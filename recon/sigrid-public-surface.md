# SIGRID/CENEPRED public surface recon

Date: 2026-08-18 (agent session). Origin: Palermo, Buenos Aires, Argentina (relevant for geo-block calls).

## Resumen ejecutivo

`sig.cenepred.gob.pe` (ArcGIS Server 10.8.1) expone su REST catalog completo sin token: la carpeta `sectores` (COEN FEN, 12 layers, ~3,225 features totales) y `sigrid/sigrid_collect` (3 layers, ~6,850 features) responden `Query,Data` a cualquiera. Los seis servicios que contienen la data de peligro/riesgo de SIGRID (`Cartografia_Peligros`, `Cartografia_Riesgos`, `Elementos_Expuestos`, `Informacion_CENEPRED`, `Informacion_Complementaria`, `prevaed`) existen y devuelven `{"code":499,"message":"Token Required"}` de forma consistente — confirmado por nombre, no inferido. `generateToken` exige username+password; no hay token anónimo.

El hallazgo más valioso no está en `sig.cenepred.gob.pe`: hay **al menos cuatro FeatureServers públicos y sin token en ArcGIS Online** que se autodenominan microzonificación sísmica CISMID (179 a 718 polígonos según el item, ninguno calza exacto con los 658 conocidos de la capa protegida — son estudios/versiones distintas, no el mismo dataset espejado). Además, `ide.igp.gob.pe/arcgis` (IGP, host completamente distinto) expone sin token un catálogo propio con capas de peligro sísmico, sismicidad, fallas neotectónicas y **una capa `zonificacion` con 552 polígonos** de estudios de zonificación/geodinámica a nivel nacional. `geocatmin.ingemmet.gob.pe` también es público y trae capas de peligros geológicos y fallas activas.

Ningún ítem de ArcGIS Online declara `licenseInfo` (viene vacío). No se encontró página dedicada de términos de uso/licencia en `sigrid.cenepred.gob.pe`; solo el pie de página genérico "Todos los derechos reservados por CENEPRED". Esto es un bloqueo real para republicar, no solo formalidad.

**Veredicto: build acotado.** Ver sección final.

## Superficie pública (tabla de endpoints)

| Endpoint | Método/param | Resultado observado | Obs/Inf |
|---|---|---|---|
| `https://sig.cenepred.gob.pe/arcgis_server/rest/services?f=json` | GET | 200, lista 10 folders + `SampleWorldCities` | Observado |
| `https://sig.cenepred.gob.pe/arcgis_server/rest/info?f=json` | GET | 200, `isTokenBasedSecurity:true`, `tokenServicesUrl`, `shortLivedTokenValidity:60` | Observado |
| `/rest/services/{FEN,FONDES,INDECI,MEF,MIDIS,MINJUS,VIVIENDA}?f=json` | GET | 200, `{"folders":[],"services":[]}` para las 7 carpetas | Observado — vacías al enumerar, no implica sin servicios (ver Superficie protegida) |
| `/rest/services/sectores?f=json` | GET | 200, expone `sectores/COEN_FEN_2023_10_5_1X` | Observado |
| `/rest/services/sectores/COEN_FEN_2023_10_5_1X/MapServer?f=json` | GET | 200, `capabilities:"Map,Query,Data"`, 12 feature layers (ids 1,3,4,5,7,9,10,12,13,14,16,17) + 3 group layers | Observado |
| `.../MapServer/{id}/query?where=1=1&returnCountOnly=true` | GET, ids 1..17 | 200 en las 12 layers reales; conteos: 1→21, 3→213, 4→1323, 5→45, 7→244, 9→19, 10→1250, 12→10, 13→33, 14→16, 16→4, 17→47 (total 3,225) | Observado |
| `/rest/services/sigrid?f=json` | GET | 200, expone `sigrid/sigrid_collect` únicamente | Observado |
| `/rest/services/sigrid/sigrid_collect/MapServer?f=json` | GET | 200, `capabilities:"Map,Query,Data"`, 3 layers: 1080004 TALLERES, 1070000 HIPECHO PNUD CHACHAPOYAS, 1080000 HIPECHO PNUD MOYOBAMBA | Observado |
| `.../sigrid_collect/MapServer/{id}/query?returnCountOnly=true` | GET | 1080004→3449, 1070000→1661, 1080000→1740 (total 6,850) | Observado |
| `/rest/services/Utilities?f=json` | GET | 200, `Utilities/RasterUtilities` (GPServer) | Observado |
| `/rest/services/Utilities/RasterUtilities/GPServer?f=json` | GET | 200, tasks `ConvertRasterFunctionTemplate`, `DownloadRaster`, ejecución async | Observado — no probado invocar la tarea |
| `/rest/services/sigrid/{Cartografia_Peligros,Cartografia_Riesgos,Elementos_Expuestos,Informacion_CENEPRED,Informacion_Complementaria,prevaed}/MapServer?f=json` | GET | 200 con body `{"error":{"code":499,"message":"Token Required","details":[]}}` en las 6 | Observado — confirma existencia + protección exacta |
| `/rest/services/sigrid/{nombre inventado}/MapServer?f=json` (Amenazas, Peligros, SIGRID, sigrid_visor, etc.) | GET | 200 con body `{"error":{"code":500,"message":"Service ... not found "}}` | Observado — permite distinguir "no existe" (500) de "protegido" (499) |
| `/arcgis_server/tokens/generateToken?f=json` | GET | 200, body `{"error":{"code":405,"message":"Method not supported","details":"HTTP GET is disabled"}}` | Observado |
| `/arcgis_server/tokens/generateToken` | POST `f=json` (sin user/pass) | 200, body `{"error":{"code":201,"message":"Exception in generating token","details":"Invalid request..."}}` | Observado — confirma que requiere username+password, no hay modo anónimo |
| `https://sig.cenepred.gob.pe/robots.txt` | GET | 404 (HTML de IIS) | Observado |

Rate limit: 5 requests consecutivos a `/rest/services?f=json` devolvieron 200 sin headers de rate-limit ni retraso perceptible. **No medido a escala** (no se probó con volumen alto sostenido).

## Superficie protegida

Los 6 servicios listados arriba (`Cartografia_Peligros`, `Cartografia_Riesgos`, `Elementos_Expuestos`, `Informacion_CENEPRED`, `Informacion_Complementaria`, `prevaed`) existen con certeza (error 499, no 500) pero ninguna operación (`?f=json` del servicio, del layer, ni `query`) es alcanzable sin token válido. Se probó explícitamente:

- `sigrid/Cartografia_Peligros/MapServer/5030402?f=json` → `499 Token Required`
- `sigrid/Cartografia_Peligros/MapServer/5030402/query?where=1=1&returnCountOnly=true` → `499 Token Required`

Sin username+password no hay ruta de acceso. El `shortLivedTokenValidity:60` (minutos) confirma que incluso con token, la sesión expira rápido — cualquier cliente tendría que re-autenticar cada hora.

Las 7 carpetas que enumeran vacías (`FEN`, `FONDES`, `INDECI`, `MEF`, `MIDIS`, `MINJUS`, `VIVIENDA`) devuelven `{"folders":[],"services":[]}` — **no verificado si tienen servicios ocultos** (ArcGIS Server puede listar carpetas vacías al usuario anónimo mientras sus servicios individuales sí existen pero no aparecen en el listado). No se intentó adivinar nombres de servicio dentro de esas 7 carpetas; sería el próximo paso si se necesita esa data.

## Rutas alternativas al mismo dato

### ArcGIS Online — microzonificación sísmica CISMID (público, sin token)

Búsqueda `https://www.arcgis.com/sharing/rest/search?q=CISMID&f=json` devolvió 15 items. Los relevantes:

| Item | Owner | Tipo | URL | Layer principal | Count observado | access |
|---|---|---|---|---|---|---|
| MICROZONIFICACION_SISMICA | cbedon_mvcs (MVCS) | Feature Service | `services6.arcgis.com/feKgID1CjSm59DTJ/.../MICROZONIFICACION_SISMICA/FeatureServer` | layer 3 "MICROZONIFICACION SISMICA" (polygon) | **179** | public |
| Microzonificación_Sísmica___CISMID | nicolasespinoza | Feature Service | `services5.arcgis.com/bHvzrGGxW8wP6Utm/.../Microzonificación_Sísmica___CISMID/FeatureServer` | layer 302 (polygon) | **718** | public |
| microzonifi_sismica_CISMID_2025 | nicolasespinoza | Feature Service | `services5.arcgis.com/bHvzrGGxW8wP6Utm/.../microzonifi_sismica_CISMID_2025/FeatureServer` | layer 0 (polygon) | **516** | public |
| Microzonificacion_sismica | geocallao2 | Feature Service | `services3.arcgis.com/pEAOvrdZJNTYkMOR/.../Microzonificacion_sismica/FeatureServer` | layer 0 (polygon, solo Callao) | **104** | public |

Todos responden `?f=json` y `query?returnCountOnly=true` sin autenticación (observado directamente). **Ninguno coincide con 658** (el conteo conocido de la capa protegida `Cartografia_Peligros/5030402`), así que no son un espejo del mismo dataset — son estudios/ediciones distintas del mismo dominio (probablemente distintos distritos, años o niveles de detalle). El de `cbedon_mvcs` (MVCS = Ministerio de Vivienda, Construcción y Saneamiento) tiene campos limpios: `departamen, provincia, distrito, id_zona, desc_zona, elaborac, fuente, zona` — este es el más prometedor para un dataset citable con procedencia (`fuente`, `elaborac` sugieren que trae metadatos de origen por feature).

**Riesgo de integridad**: los 4 items tienen `editorTrackingInfo.allowAnonymousToUpdate:true` y, en 2 de ellos, `allowAnonymousToDelete:true`. Son "hosted feature layers" editables por cualquiera con la URL — cualquier query en un momento dado puede reflejar vandalismo, no el dataset original. Esto es un riesgo real para cualquier pipeline que dependa de leerlos en producción.

**Búsqueda `microzonificacion sismica peru` en AGOL dio `total:0`** — el término en español con tildes/sin CISMID no indexa nada; solo la búsqueda por "CISMID" encontró resultados. Necesita verificación: correr más variantes (`SIGRID`, `zonificación sísmica`, nombres de distrito) para descartar más candidatos.

### IGP — `ide.igp.gob.pe/arcgis` (host completamente distinto, público sin token)

`GET https://ide.igp.gob.pe/arcgis/rest/services?f=json` → 200 sin token, folders: `cienciastierrasolida, Hosted, mapabase, monitoreocensis, monitoreocenvul, REDES, regen, Utilities`.

| Servicio | Layers relevantes | Count observado |
|---|---|---|
| `cienciastierrasolida/EstudiosZonificacion/MapServer` | layer 9 "zonificacion" (polygon, campo `ciudad`) | **552** |
| `cienciastierrasolida/EstudiosZonificacion/MapServer` | layer 10 "zona estudiada" | 87 |
| `mapabase/riesgo/MapServer` | layer 1 "area" | 10 |
| `monitoreocensis/PeligroSismico/MapServer` | 4 layers: `Periodo_retorno_500`, `Periodo_retorno_1000`, `Departamento`, `Acoplamiento_sismico` | no contado (fuera de foco) |
| `monitoreocensis/SismosReportados/MapServer` | 6 layers incl. `Catalogo_Sismo_2015`, `Placa_Tectonica`, `Epicentro` | no contado |
| `mapabase/FallaGeologica/MapServer` | `falla_geologica`, `falla_neotectonica` | no contado |
| `REDES/E030/MapServer` | `E030`, `SismosE030`, `AreaTsunami`, `DisE030` (NO layer 5 — ver nota) | — |

**Nota de corrección**: la sesión previa citó `ide.igp.gob.pe/arcgis/rest/services/REDES/E030/MapServer/5` como un item de ArcGIS Online (owner `fariasaz`). Probado directamente: ese `MapServer` solo tiene layers 0-3; `layer/5?f=json` devuelve `{"error":{"code":404,"message":"Layer not found"}}`. El ítem de AGOL que apunta ahí es una referencia rota o desactualizada — **no usar esa URL**, la data real de sismos/tsunami está en las layers 0-3 del mismo servicio (`SismosE030` id=2, `AreaTsunami` id=3).

`ide.igp.gob.pe/arcgis/rest/info?f=json` reporta `isTokenBasedSecurity:true` a nivel de portal, pero **en la práctica todos los MapServer probados responden completos sin token** — la bandera existe pero no está aplicada a estos servicios específicos (observado, no supuesto).

### GEOCATMIN (INGEMMET) — público sin token

`GET https://geocatmin.ingemmet.gob.pe/arcgis/rest/services?f=json` → 200, catálogo grande (11 folders, ~70 servicios en la carpeta raíz). Probado por nombre y confirmado `capabilities:"Map,Query,Data"` en:
- `SERV_PELIGROS_GEOLOGICOS` — 8 layers incl. "Peligros Geológicos", "Cartografia de Peligros"
- `SERV_NEOTECTONICO` — 6 layers incl. "Falla Neotectonica", "Sismos 1950-2023"
- `SERV_GEOLOGIA_FALLAS` — fallas a escalas 1000k/100k/50k

No se contaron features (fuera del foco sísmico-microzonificación directo; queda como inventario, no como recon profundo).

### Portal de datos abiertos (`www.datosabiertos.gob.pe`)

Es Drupal, **no CKAN** (corregido durante la sesión — el path `/api/3/action/package_search` devuelve el 404 HTML estándar de Drupal, no un JSON de CKAN; asumir CKAN por la URL fue un error de la primera pasada). Requiere User-Agent de navegador — sin él, algunas rutas devuelven 418 con página de bloqueo CloudWAF (`华为云 WAF`, texto en chino, "访问被拦截" = "acceso bloqueado"); con UA de Chrome, las mismas rutas responden normal. Confirmado con:
- `GET /node/2272/download` (con UA browser) → 302 → 200, PDF real de 10.8MB: `Zonificación_Sismica_Geotecnica_IGP_Chosica.pdf`.
- Búsqueda web (no API directa) encontró referencias a `sigrid.cenepred.gob.pe/sigridv3/documento/*` PDFs de microzonificación (Cusco, Carabayllo, Puente Piedra, Lima 2016/2018) indexados por buscadores externos, no confirmados vía la propia búsqueda interna del portal (el form de búsqueda de Drupal no devolvió resultados al probarlo con `?query=microzonificacion`, **necesita verificación** con la UI real vía navegador).

### SIGRID Biblioteca (`sigrid.cenepred.gob.pe/sigridv3`) — sitio de documentos, distinto de `sig.cenepred.gob.pe`

Host completamente público (sin XSRF-wall efectivo para lectura, cookies se emiten pero no bloquean GET). Confirmado:
- `GET /sigridv3/documento/biblioteca?c=Microzonificación+Sísmica` → 200, lista documentos con links `documento/{id}`.
- `GET /sigridv3/documento/6990` → 200, página del documento "Mapa de microzonificación sísmica de la ciudad de Lima actualizado al año 2018 (CISMID)".
- Botón "Descargar Archivos" → `GET /sigridv3/documento/6990/descargar` → **302** → redirige a `https://sigrid.cenepred.gob.pe/sigridv3/storage/biblioteca//6990_mapa-de-microzonificacion-sismica-de-la-ciudad-de-lima-actualizado-al-ano-2018.PNG` — **es una imagen raster (mapa impreso), no vector data**.
- Botón "Descargar todo el ambito en formato .SHP" ejecuta `dojoExportToShapefile(map.graphics, ...)` client-side sobre un polígono WKT **embebido literal en el HTML** que representa solo el ámbito/extensión del documento (el rectángulo de cobertura), no las zonas de microzonificación clasificadas con sus atributos. Confirmado leyendo el JS inline — no requirió navegador.
- No se encontró ninguna llamada AJAX/API JSON en las páginas de biblioteca o documento (grep de `fetch(`, `axios`, `.ajax(`, `/api/` sobre el HTML completo → 0 matches) — el sitio es server-rendered clásico, no hay endpoint JSON que enumerar.

**Conclusión de esta ruta**: la biblioteca SIGRID da acceso público a PDFs/PNGs de los estudios (documento por documento, con metadatos y el polígono de ámbito), pero no a la capa vectorial clasificada con sus 658 polígonos y atributos de zonificación. Es una fuente legítima para citar/enlazar estudios individuales, no para extraer el dataset geoespacial completo.

**Necesita verificación**: el botón "ACCEDER AL VISOR DE MAPAS" en la home de `sigrid.cenepred.gob.pe` no se pudo trazar — el click no disparó ninguna llamada a `arcgis` capturada en la sesión de red (posible que abra en pestaña nueva no capturada, o que el selector clickeado no era el real). Screenshot tomado confirma que existe un modal "COMUNICADO OFICIAL" que cubre la página al cargar (guardado en `recon/sigrid-popup.png`) — se cerró correctamente antes del intento de click, pero el visor en sí queda sin trazar. Paso que lo confirmaría: abrir con navegador headed, cerrar el popup, click directo en el botón con snapshot inmediato post-click, y capturar network con `agent-browser network requests --url "*arcgis*"` mientras el visor carga capas.

## Otras fuentes de riesgo sísmico peruano consumibles

Solo lo tocado directamente:

- **IGP `ide.igp.gob.pe/arcgis`**: catálogo completo público (detalle arriba). El más relevante para complementar microzonificación con contexto sismológico (catálogo sísmico, fallas neotectónicas, aceleración esperada por periodo de retorno).
- **INGEMMET `geocatmin.ingemmet.gob.pe/arcgis`**: catálogo público con capas de peligros geológicos y fallas activas (detalle arriba), no explorado a nivel de layer individual.
- **Portal de datos abiertos**: al menos un PDF de zonificación sísmica-geotécnica IGP (Chosica) descargable directo, sin token. Es plausible que haya más recursos similares por distrito pero no se hizo un barrido sistemático del portal (requeriría UI/browser real dado que la búsqueda por query string no funcionó).
- **INDECI**: `portal.indeci.gob.pe/arcgis/rest/services` → 301 (redirect, no explorado más allá; **necesita verificación**, no se siguió el redirect por estar fuera del foco de la sesión).

## Términos de uso / licencia

**No se encontró una página dedicada de términos de uso, licencia de datos, o condiciones de redistribución en `sigrid.cenepred.gob.pe`.** Se buscó explícitamente en la navegación (INICIO, BIBLIOTECA, DRONES, ESCENARIOS, EVAR, PLANES, FONDES, REPORTES, MANUALES, VIDEOS, NORMALIZACIÓN DEL SIGRID, FAQS) — ninguno es una página de licencia. El único texto legal encontrado es el pie de página, idéntico en `/preguntas` y `/normalizacion`:

> "© Copyrights 2023, Todos los derechos reservados por CENEPRED."

Esto es una reserva de derechos explícita, no una licencia abierta. **No autoriza redistribución** por defecto.

En ArcGIS Online, los 4 FeatureServers de microzonificación tienen `licenseInfo:""` y `accessInformation:""` (campos vacíos, confirmado leyendo el JSON del item vía `sharing/rest/content/items/{id}?f=json`) — `access:"public"` solo significa "visible sin login", no implica licencia de reuso. Legalmente equivalente a "sin licencia declarada".

`datosabiertos.gob.pe` (la Plataforma Nacional de Datos Abiertos) no expone un campo de licencia por dataset accesible en las páginas revisadas; la guía general de la PNDA menciona un "Marco de Gobernanza de Datos del Estado Peruano" pero no se encontró el texto de licencia aplicado a los recursos específicos de CENEPRED/IGP.

**Necesita verificación**: contactar directamente a CENEPRED (`soporte-sigrid@cenepred.gob.pe`, visible en el pie de `/preguntas`) para preguntar explícitamente por condiciones de reuso de los datos públicos vía REST, dado que no hay licencia escrita en ningún lugar tocado.

## Nota de reconciliación con `recon/cismid-igp-sources.md`

Este mismo directorio ya tenía un recon paralelo (`recon/cismid-igp-sources.md`, mismo día) que cubre terreno complementario: IGP corre además un **GeoServer WFS** en `ide.igp.gob.pe/geoserver/ows` (distinto del ArcGIS REST Server en `ide.igp.gob.pe/arcgis` que se documentó arriba en este reporte — son dos servicios separados en el mismo host). Ese WFS expone `ZonificacionSismica:zonificacion_sismica` con **544 features** y, más importante para la pregunta de licencia de esta sesión, **el propio `GetCapabilities` del servicio declara `ows:Fees: NONE` y `ows:AccessConstraints: NONE`** — verificado de forma independiente en esta sesión:

```
GET https://ide.igp.gob.pe/geoserver/ows?service=wfs&version=2.0.0&request=GetCapabilities → 200
<ows:Fees>NONE</ows:Fees>
<ows:AccessConstraints>NONE</ows:AccessConstraints>

GET .../ows?service=wfs&version=2.0.0&request=GetFeature&typeName=ZonificacionSismica:zonificacion_sismica&resultType=hits → 200, numberMatched="544"
```

Esto es la única declaración de licencia/términos explícita y afirmativa encontrada en todo el recon combinado (ambos archivos) — todo lo demás (SIGRID, ArcGIS Online, datosabiertos.gob.pe) no tiene licencia declarada o tiene copyright reservado por defecto. **Esto cambia el veredicto de licencia**: para el dato de zonificación sísmica-geotécnica de IGP específicamente, hay base para consumir y redistribuir sin pedir permiso adicional. Para todo lo demás (CISMID en cualquiera de sus formas, MVCS, SIGRID/CENEPRED), la recomendación de "no republicar sin permiso" del encargo original se mantiene.

El otro archivo también documenta capas WFS adicionales de IGP no exploradas en detalle aquí (`CapacidadPortante`, `Suelos`, `Geologia`, `Geomorfologia`, `Geodinamica`, `PGA`) cubriendo ~57 ciudades — no se duplica ese detalle en este reporte; ver el archivo original para campos y ejemplos de `GetFeature`.

## Necesita verificación

- Si las 7 carpetas "vacías" (`FEN`, `FONDES`, `INDECI`, `MEF`, `MIDIS`, `MINJUS`, `VIVIENDA`) tienen servicios individuales alcanzables por nombre adivinado, igual que se hizo con `sigrid/*`. Paso: repetir el patrón de guessing (`{folder}/{nombre probable}/MapServer?f=json`) contra cada una.
- Confirmar el conteo de 658 polígonos en `sigrid/Cartografia_Peligros/MapServer/5030402` — no reproducible en esta sesión porque no hay token; queda como dato de la sesión anterior, no re-verificado.
- Trazar el "VISOR DE MAPAS" de `sigrid.cenepred.gob.pe` con browser headed y captura de red completa, para confirmar si usa un token embebido de solo-lectura o si también da 499.
- Búsqueda exhaustiva en ArcGIS Online con más variantes de término (`zonificación sísmica`, `SIGRID`, nombres de distrito específicos) — solo se probaron `microzonificacion sismica peru` (0 resultados) y `CISMID` (15 resultados).
- Confirmar si `portal.indeci.gob.pe/arcgis` (redirect 301 observado, no seguido) expone algo relevante.
- Verificar si algún distrito de los 4 FeatureServers de AGOL se superpone geográficamente con la capa protegida de 658 polígonos (comparar geometría, no solo conteo) — solo se comparó conteo total, no coincidencia espacial.
- Confirmar por escrito con CENEPRED las condiciones de reuso, dado que no hay licencia publicada.

## Veredicto

**Build acotado.** No hay camino directo, público y estable a los 658 polígonos de `Cartografia_Peligros/5030402` sin credenciales — ese dataset específico permanece detrás de `499 Token Required` con `generateToken` exigiendo usuario/contraseña real. Ese dataset puntual queda fuera de alcance.

Pero hay una superficie pública, estable, y con licencia declarada suficiente para un producto acotado — más fuerte de lo que parecía al iniciar la sesión:

1. **IGP GeoServer WFS (`ide.igp.gob.pe/geoserver/ows`)** es la fuente ganadora, no la ArcGIS REST de abajo. `ZonificacionSismica:zonificacion_sismica` (544 features, ~57 ciudades) con `ows:Fees:NONE` y `ows:AccessConstraints:NONE` declarados por el propio servicio — la única licencia afirmativa de todo el recon. Corroborado independientemente por el catálogo nacional GEOIDEP como geoportal oficial. Detalle completo en `recon/cismid-igp-sources.md`.
2. **IGP `ide.igp.gob.pe/arcgis`** (ArcGIS REST, servicio separado en el mismo host) es la segunda fuente sólida: sin token, capabilities completas, capa `zonificacion` (552 polígonos, vía `cienciastierrasolida/EstudiosZonificacion`) más contexto sismológico (catálogo, fallas, aceleración). No tiene una declaración de licencia explícita como el WFS — usar el WFS como fuente primaria cuando el mismo dato esté disponible en ambos.
3. El FeatureServer `MICROZONIFICACION_SISMICA` de `cbedon_mvcs` (MVCS) en ArcGIS Online tiene el schema más limpio (`fuente`, `elaborac` como campos de procedencia) pero **es editable por anónimos** y sin licencia declarada — cualquier pipeline que lo consuma en producción debe asumir que el dato puede cambiar sin aviso y sin control de versión, y debería cachear con fecha de captura, no hacer polling en vivo sin snapshot.
4. La biblioteca de `sigrid.cenepred.gob.pe` es útil como capa de citas/enlaces a estudios PDF individuales, no como fuente de datos geoespaciales.

Lo que desbloquea el dataset completo de CENEPRED (658 polígonos con clasificación de peligro): credenciales de `generateToken` en `sig.cenepred.gob.pe`, obtenidas por CENEPRED directamente — no hay atajo público equivalente encontrado en esta sesión. Dado que IGP ya cubre el mismo dominio (zonificación sísmica-geotécnica) con licencia abierta declarada, la recomendación es **construir sobre IGP primero** y tratar el dataset de CENEPRED como algo a pedir formalmente si hace falta el detalle específico de esos 658 polígonos, no como bloqueante de v1.

Lo que bloquea publicar el resto de lo encontrado (SIGRID/CENEPRED en cualquiera de sus formas, ArcGIS Online de terceros, CISMID) en el proyecto source-only: no hay licencia escrita en esos hosts. El copyright genérico de CENEPRED y los campos de licencia vacíos en AGOL son señal de "no autorizado por defecto", no de dominio público. IGP WFS es la única excepción confirmada con evidencia afirmativa.
