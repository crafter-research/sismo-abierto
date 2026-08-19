# SIGRID visor — cómo obtiene sus datos

Sesión: 2026-08-19, origen Palermo, Buenos Aires, Argentina. Objetivo: documentar el mecanismo de datos del visor `https://sigrid.cenepred.gob.pe/sigridv3/mapa?id=47538&boletin=558`, no automatizar nada. Herramientas: `agent-browser` (Chrome headless real, red capturada) + `curl` directo para aislar cada variable.

## Resumen ejecutivo

El visor SIGRID es público sin login. En cada carga de página, el backend Laravel de `sigridv3` (PHP 7.1.7, `sigridv3_session` + `XSRF-TOKEN` en cookies) **mint un token ArcGIS server-side fresco** y lo embebe literal dentro de un `<script>` inline en el HTML de respuesta, vía `sessionStorage.setItem("arcgis_token", "...")`. No hay ningún request de red a `generateToken` — el token nace ya en el HTML, sin que el navegador lo pida. Confirmado con `curl` puro (sin cookies, sin sesión, sin JS) pidiendo la misma URL dos veces: cada golpe devuelve HTML de 3428 bytes con un token distinto.

Ese token es **válido solo con el header `Referer` apuntando a `sigrid.cenepred.gob.pe/` (con slash o con path después del host)**. Sin ese Referer exacto, el mismo `sig.cenepred.gob.pe` (ArcGIS Server 10.8.1 sobre IIS/ASP.NET) devuelve `498 Invalid Token` aunque el token sea el correcto. El `User-Agent` y el header `Origin` no importan — probado explícitamente. Con el Referer correcto, el token abre las 6 capas protegidas (`Cartografia_Peligros`, `Cartografia_Riesgos`, `Elementos_Expuestos`, `Informacion_CENEPRED`, `Informacion_Complementaria`, `prevaed`) incluida la capa objetivo `5030402` (Microzonificación Sísmica CISMID, **658 polígonos confirmados por query real**, no solo por metadata).

No existe una ruta pública alternativa a los datos vectoriales clasificados con atributos. El panel "IMPRESIÓN" del visor genera un PDF vía un GP Service (`PRINT_A4/GPServer`) que también exige el mismo token — pero el archivo PDF resultante, una vez generado, queda servido sin token en el directorio scratch de ArcGIS (hallazgo nuevo: `arcgisjobs/.../scratch/*.pdf` es público). Es sólo un mapa impreso rasterizado con leyenda, no data. El botón "Descargar todo el ámbito en .SHP" de la biblioteca (`sigridv3/documento/*`, ruta ya mapeada en la sesión previa) exporta el polígono de ámbito del documento, no la capa clasificada.

CENEPRED no publica ningún término de uso ni licencia para SIGRID en ningún lugar tocado (visor, biblioteca, sitio institucional). El único canal de contacto documentado es `soporte-sigrid@cenepred.gob.pe`, también accesible desde un formulario "ENVÍENOS UN MENSAJE" dentro del propio visor.

## Cómo obtiene el token el visor

Paso a paso, observado directamente:

1. El navegador pide `GET https://sigrid.cenepred.gob.pe/sigridv3/mapa?id=47538&boletin=558` (sin cookies previas, sin login).
2. La respuesta HTML (3428 bytes, servidor `Microsoft-IIS/10.0` + `X-Powered-By: PHP/7.1.7`) trae, dentro de un `<script>` en el `<head>`, esta línea literal:

   ```html
   sessionStorage.setItem("arcgis_token", "<token de ~108 caracteres>");
   ```

   Confirmado byte a byte leyendo la respuesta cruda de `curl` (sin ejecutar JS). El servidor manda cookies `set-cookie: XSRF-TOKEN=...` y `set-cookie: sigridv3_session=...` (firma Laravel) en la misma respuesta, pero **el token de ArcGIS no depende de esas cookies** — se repitió el `curl` sin guardar ni reenviar cookies y el token siguió llegando fresco cada vez.
3. El resto del bootstrap (`js/config/app.js`, ArcGIS JS API 3.41 compact) lee ese `sessionStorage` en el cliente y lo adjunta como query param `token=` en cada llamada posterior a `.../MapServer/export`, `.../MapServer/{id}/query` y `.../GPServer/.../submitJob`.
4. **Nunca se observó una llamada de red a `generateToken`** durante la carga del visor (HAR completo capturado con `agent-browser network har start --content all`, 316 requests, cero matches de `generateToken`). El backend de `sigridv3` genera el token del lado servidor, probablemente llamando `generateToken` internamente con credenciales de servicio propias antes de renderizar el HTML — eso no es observable desde el cliente, es inferencia razonable a partir de que (a) el token cambia en cada page load, (b) `sig.cenepred.gob.pe/arcgis_server/tokens/generateToken` exige usuario+contraseña reales (confirmado en la sesión previa) y (c) el HTML llega con el token ya resuelto.

**No verificado**: la URL/mecanismo exacto que usa el backend de `sigridv3` para llamar a `generateToken` (¿de qué usuario de servicio, con qué `client` param — `referer` o `ip`?). Es información server-side no observable desde afuera sin acceso al código de `sigridv3`.

## Matriz de autenticación medida

Todas las pruebas contra `https://sig.cenepred.gob.pe/arcgis_server/rest/services/sigrid/Cartografia_Peligros/MapServer/5030402?f=json&token=<token vigente>`, vía `curl` puro (sin navegador), repetidas 3 veces cada una para descartar intermitencia:

| Variante | Resultado | Código |
|---|---|---|
| Token válido + `Referer: https://sigrid.cenepred.gob.pe/` (con slash) | Metadata completa de la capa | 200 body OK |
| Token válido + `Referer: https://sigrid.cenepred.gob.pe/sigridv3/mapa?id=1` (subpágina) | Metadata completa | 200 body OK |
| Token válido + `Referer: https://sigrid.cenepred.gob.pe` (**sin** slash) | Rechazado, reproducible 3/3 | `498 Invalid Token` |
| Token válido + `Referer: https://example.com/` (dominio ajeno) | Rechazado | `498 Invalid Token` |
| Token válido + sin ningún `Referer` | Rechazado | `498 Invalid Token` |
| Token válido + header `Origin` en vez de `Referer` | Rechazado | `498 Invalid Token` |
| Token válido + `Referer` correcto + `User-Agent` vacío | Aceptado (UA no importa) | 200 body OK |
| Sin `token` en absoluto (param ausente) | — | `499 Token Required` |
| `token=` vacío | — | `499 Token Required` |
| `token=abc123` (basura) | — | `498 Invalid Token` |
| Token válido + `Referer: https://sigrid.cenepred.gob.pe.evil.com/` (dominio que contiene el real como substring) | Rechazado — no es matching por substring | `498 Invalid Token` |
| Token válido + `Referer: http://sigrid.cenepred.gob.pe/` (mismo host, esquema `http` en vez de `https`) | Rechazado — el esquema también se valida | `498 Invalid Token` |

Distinción reproducible y consistente: **499 = falta el parámetro `token`**, **498 = el parámetro está presente pero es inválido/expirado/con Referer incorrecto**. El servidor no distingue en el mensaje entre "token expirado" y "token de Referer equivocado" — ambos casos dan 498.

`f=geojson` funciona directo en el endpoint de query (con token+Referer válidos) — no hace falta convertir desde Esri JSON a mano:

```
GET .../5030402/query?where=1=1&outFields=*&f=geojson&token=...  (con Referer correcto)
→ 200, FeatureCollection GeoJSON válido con MultiPolygon
```

`FeatureServer` (variante REST más moderna de ArcGIS) no existe para este servicio — devuelve `{"error":{"code":500}}`. Solo `MapServer` está expuesto.

## Vida útil medida

Metodología: se extrajo un token del HTML crudo de `curl` (sin navegador, sin cookies) a las **2026-08-19T04:51:48Z**, y se lo volvió a probar cada ~90 segundos contra `.../5030402?f=json&token=...` con el `Referer` correcto, vía un loop en background, hasta observar dos fallos consecutivos o agotar el presupuesto de la sesión.

[PENDIENTE DE COMPLETAR — el loop de medición seguía corriendo al momento de escribir esta sección. Ver bloque "Necesita verificación" y actualizar esta tabla con el resultado final antes de cerrar el reporte.]

El servidor declara `shortLivedTokenValidity: 60` (minutos) en `/arcgis_server/rest/info?f=json` (confirmado en la sesión previa, no re-verificado en esta). Esa es la duración *declarada*, no la medida — el objetivo de este bloque es contrastarla con el comportamiento real.

No se observó rate-limiting en el endpoint que emite el token: 5 cargas consecutivas de `sigridv3/mapa?id=47538&boletin=558` completaron en ~0.65-0.70s cada una sin degradación ni bloqueo — **no medido a escala** (no se probó con volumen alto sostenido ni en paralelo).

## Rutas alternativas al mismo dato

Ítem por ítem según lo pedido:

- **Modo export/descarga del visor**: sí existe, panel "IMPRESIÓN" → genera PDF vía `sigrid/PRINT_A4/GPServer/ExportWebMap` (Print Task estándar de ArcGIS). **Requiere el mismo token** para `submitJob` (confirmado por captura de red: `submitJob` y el polling de `jobs/{jobId}` llevan `token=`). Es un mapa A4 rasterizado con leyenda y escala fija (1:5000 a 1:10000000) — no exporta atributos ni geometría vectorial. **Hallazgo nuevo de esta sesión**: el PDF resultante, una vez el job completa, queda servido en `sig.cenepred.gob.pe/arcgis_server/rest/directories/arcgisjobs/sigrid/print_a4_gpserver/{jobId}/scratch/{hash}.pdf` **sin ningún token** — confirmado con `curl` limpio, HTTP 200, `content-type: application/pdf`, 594KB, se abre y es un mapa real. Este bypass solo sirve para el output ya renderizado de un job que alguien más ya disparó (con su propio token) — no es una vía para generar nuevos exports sin token, porque `submitJob` sigue exigiéndolo.
- **`.../MapServer/export` sin token**: probado directo, devuelve `{"error":{"code":499,"message":"Token Required"}}` como JSON aunque se pida `f=image` — no hay bypass de imagen pública.
- **Servicio en carpeta pública con la misma capa**: la carpeta pública `sigrid/sigrid_collect` (3 layers, ya mapeada en la sesión previa: TALLERES, HIPECHO PNUD Chachapoyas, HIPECHO PNUD Moyobamba) no contiene microzonificación sísmica — es data de talleres/diagnósticos participativos, dominio distinto.
- **ArcGIS Online / GeoIDEP / MVCS / portal de datos abiertos**: ya mapeados exhaustivamente en la sesión anterior (`recon/sigrid-public-surface.md`, `recon/cismid-igp-sources.md`) — no se repite el detalle aquí. Resumen: hay 4 FeatureServers públicos de "microzonificación sísmica CISMID" en ArcGIS Online (ninguno con 658 features exactos, son estudios/ediciones distintas) y el WFS de IGP (`ide.igp.gob.pe/geoserver/ows`, `ZonificacionSismica:zonificacion_sismica`, 544 features) que es la única fuente con licencia afirmativa (`Fees:NONE`, `AccessConstraints:NONE`) de todo el recon combinado.
- **`portal.indeci.gob.pe/arcgis`**: la sesión previa lo dejó como "301, no seguido". **Verificado en esta sesión**: el redirect apunta a `https://www.gob.pe/indeci` (portal genérico del Estado, no ArcGIS). El servicio ArcGIS de INDECI en ese host está decomisionado o migrado — no es una ruta viable.
- **CENEPRED (`cenepred.gob.pe`, dominio institucional, distinto de `sigrid.cenepred.gob.pe`)**: sin `robots.txt` (404), sin sección de datos abiertos ni términos visible en el home revisado. **Necesita verificación**: no se hizo un barrido completo del sitio institucional, solo el home.

## Inventario de capas tras el token

Con el token vigente de esta sesión + `Referer` correcto, se enumeraron las 6 capas protegidas completas (`?f=json` de cada `MapServer`) y se pidió `returnCountOnly=true` a cada layer hoja (no-grupo). 270 layers hoja en total, recorridas todas sin bloqueo ni rate-limit perceptible (~2m21s para las 270 llamadas secuenciales).

| Servicio | Layers hoja | Suma de features (solo Feature Layers, no rasters) |
|---|---|---|
| `Cartografia_Peligros` | 48 | 176,843 |
| `Cartografia_Riesgos` | 3 | 7,148 |
| `Elementos_Expuestos` | 30 | 6,376,860 |
| `Informacion_CENEPRED` | 19 | 26,393 |
| `Informacion_Complementaria` | 49 | 441,392 |
| `prevaed` | 121 | 105,022 |
| **Total** | **270** | **7,133,658** |

20 de las 270 layers son `Raster Layer` (no soportan `query?returnCountOnly`, devuelven `"Invalid or missing input parameters"` — comportamiento esperado de ArcGIS para capas raster, no un error de acceso). El resto son `Feature Layer` con conteo real.

`Elementos_Expuestos` domina el total (6.38M de los 7.13M) — coherente con ser la capa de infraestructura expuesta (edificaciones, población, etc.) a nivel nacional, mucho más granular que las capas de peligro/riesgo.

La capa objetivo `Cartografia_Peligros/5030402` ("Microzonificación Sísmica - CISMID") devolvió **658** features — coincide exacto con el número citado en la sesión previa (que no había podido re-verificarlo por falta de token). **Confirmado en esta sesión con query real.**

**Necesita verificación**: no se enumeraron las 20 raster layers por nombre/propósito individual más allá del listado crudo — quedaron marcadas como "raster, sin conteo" en el JSONL de trabajo pero no se revisó cada una manualmente. Tampoco se intentó adivinar servicios dentro de las 7 carpetas que la sesión previa encontró vacías (`FEN`, `FONDES`, `INDECI`, `MEF`, `MIDIS`, `MINJUS`, `VIVIENDA`).

## Schema de 5030402

`GET .../Cartografia_Peligros/MapServer/5030402?f=json` (con token+Referer) → `geometryType: esriGeometryPolygon`, `spatialReference: {wkid: 4326}` (WGS84, no proyectado — coincide con lo que devuelve `f=geojson` sin transformación adicional).

17 campos:

| Campo | Tipo | Alias | Longitud |
|---|---|---|---|
| `objectid` | esriFieldTypeOID | objectid | — |
| `departamen` | String | Departamento | 100 |
| `provincia` | String | Provincia | 100 |
| `distrito` | String | Distrito | 100 |
| `id_zona` | String | Zona | 30 |
| `desc_zona` | String | Descripcion | 254 |
| `elaborac` | String | Fecha elaboracion | 50 |
| `proyecto` | String | Proyecto | 254 |
| `fuente` | String | Fuente | 150 |
| `url` | String | url | 300 |
| `url_img` | String | url_img | 300 |
| `shape` | esriFieldTypeGeometry | shape | — |
| `observ` | String | observ | 250 |
| `nom_lugar` | String | nom_lugar | 150 |
| `operador` | String | operador | 15 |
| `fecha_ed` | esriFieldTypeDate | fecha_ed | 8 |
| `url1` | String | url1 | 250 |
| `url1_img` | String | url1_img | 250 |

Ejemplos reales (2 de 3 pedidos, atributos completos, sin geometría por instrucción de la tarea):

```json
{
  "objectid": 133,
  "departamen": "Ancash",
  "provincia": "Huaraz",
  "distrito": "Independencia y Huaraz",
  "id_zona": "Zona V",
  "desc_zona": "Zona VB  Condiciones desfavorables. Topografía plana. Se espera asentamientos, agrietamiento y ampliación sísmica. Se recomienda usar plateas de cimentación para estructuras de más de dos pisos",
  "elaborac": "02/06/2016",
  "proyecto": "Instalación del servicio de alerta temprana frente al riesgo de aluvión en la población de la subcuenca Quillcay, mancomunidad municipal Waraq, distrito de Independencia – Huaraz – Ancash",
  "fuente": "Municipalidad Provincial de Huaraz - CARE",
  "operador": null,
  "fecha_ed": null
}
```

```json
{
  "objectid": 134,
  "departamen": "Ancash",
  "provincia": "Huaraz",
  "distrito": "Independencia y Huaraz",
  "id_zona": "Zona IV",
  "desc_zona": "Zona IVB Topografía de pendiente pronunciada. Se espera asentamientos, agrietamientos y ampliación sísmica. se recomienda usar zapatas conectadas",
  "elaborac": "02/06/2016",
  "proyecto": "Instalación del servicio de alerta temprana frente al riesgo de aluvión en la población de la subcuenca Quillcay, mancomunidad municipal Waraq, distrito de Independencia – Huaraz – Ancash",
  "fuente": "Municipalidad Provincial de Huaraz - CARE"
}
```

Campos `url`, `url_img`, `observ`, `nom_lugar`, `url1`, `url1_img` vinieron vacíos (`" "`, un solo espacio) en las 3 features de muestra — **no verificado si otras features del dataset los usan** (probablemente campos legacy o solo poblados para algunos estudios).

Geometría (una feature inspeccionada por separado, truncada): `esriGeometryPolygon`, 2 anillos, el anillo principal con 433 vértices — polígonos densos y detallados, consistente con un estudio de microzonificación a escala de detalle urbano.

## Términos de uso y vía formal de acceso

No hay página de términos de uso ni licencia dedicada en `sigrid.cenepred.gob.pe` (confirmado en la sesión previa recorriendo toda la navegación del sitio, no repetido en esta sesión). El único texto legal es el pie de página genérico: *"© Copyrights 2023, Todos los derechos reservados por CENEPRED."* — reserva de derechos, no licencia abierta.

`cenepred.gob.pe` (sitio institucional, dominio separado): sin `robots.txt` (404), sin sección de "datos abiertos" ni "términos de uso" visible en el home. **Necesita verificación**: solo se revisó el home, no un barrido completo del sitio.

Vía de contacto confirmada, dos canales que llegan al mismo lugar:
- **Correo**: `soporte-sigrid@cenepred.gob.pe`, visible en el pie de `/sigridv3/preguntas`.
- **Formulario dentro del visor**: panel "ENVÍENOS UN MENSAJE" (siempre visible en la barra lateral izquierda del visor, sin necesidad de login) — pide Nombre y el mensaje, texto de ayuda: *"Escriba una consulta o comentario sobre el SIGRID y nos comunicaremos a la brevedad con Ud."*. No es un formulario de solicitud formal de credenciales — es un buzón de contacto genérico.

No se encontró ningún formulario, oficina, o proceso documentado específicamente para pedir credenciales de `generateToken` o acceso API formal a `sig.cenepred.gob.pe`. La única vía visible es ese correo/formulario genérico.

## Necesita verificación

- Resultado final de la medición de vida útil del token (bloque pendiente arriba) — completar antes de considerar cerrado este reporte.
- Mecanismo exacto server-side de `sigridv3` para mintear el token (usuario de servicio, parámetros de `generateToken` usados internamente) — no observable desde el cliente.
- Las 20 raster layers del inventario, una por una (propósito, resolución) — solo se registró que son raster y no soportan conteo.
- Las 7 carpetas "vacías" (`FEN`, `FONDES`, `INDECI`, `MEF`, `MIDIS`, `MINJUS`, `VIVIENDA`) — heredado de la sesión previa, sigue sin resolver.
- Rate-limiting a escala (solo se probaron 5 requests consecutivos, sin volumen alto ni paralelo).
- Barrido completo de `cenepred.gob.pe` más allá del home, buscando específicamente una sección de datos abiertos o transparencia que no se haya indexado en la portada.
- Si el bypass del PDF de scratch (`arcgisjobs/.../scratch/*.pdf` público) es reproducible con jobs de otros usuarios/sesiones o si depende de que el hash del archivo sea impredecible (no se intentó adivinar un hash ajeno, sería fuera de alcance ético de este recon).

## Veredicto

**No hay una vía pública y estable de consumir la capa `5030402` (ni ninguna de las 6 capas protegidas) sin pasar por el mecanismo de token del visor.** Pero ese mecanismo es, en la práctica, un colador: cualquiera puede cargar `sigridv3/mapa` sin login, leer el token embebido en el HTML, adjuntar el header `Referer: https://sigrid.cenepred.gob.pe/`, y consultar las 6 capas completas incluyendo `f=geojson` — sin usuario, sin contraseña, sin `generateToken` propio. Esto no es una "ruta legítima" en el sentido de estar documentada o autorizada — es el mismo mecanismo que usa el visor público, reproducido con `curl`, aprovechando que la única barrera (`Referer` de origen) es un header que cualquier cliente HTTP puede fijar libremente.

Dicho de otro modo: **CENEPRED protege estos datos con `Referer` allowlisting, no con autenticación real.** Cualquier consumidor que se identifique como viniendo de `sigrid.cenepred.gob.pe` pasa. Esto es plausible que sea intencional — el token existe para servir el visor público, no para restringir el dato en sí — pero **no hay ninguna declaración de licencia que autorice el reuso** de lo que se obtiene por esa vía. Es acceso técnicamente posible, legalmente no autorizado por escrito.

Para Hunter, con esto en mano, hay dos caminos honestos:
1. **Pedir acceso formal** vía `soporte-sigrid@cenepred.gob.pe`, explicando el proyecto (`sismo-abierto`) y pidiendo explícitamente (a) confirmación de que el mecanismo Referer-based es el modo de consumo previsto para terceros, o (b) credenciales de `generateToken` propias, y (c) una declaración de licencia de reuso — dado que hoy no existe ninguna.
2. **Construir primero sobre IGP** (`ide.igp.gob.pe/geoserver/ows`, WFS con `Fees:NONE`/`AccessConstraints:NONE` declarado — la única licencia afirmativa de todo el recon combinado) y tratar el dataset CISMID de CENEPRED como un complemento a pedir formalmente, no como bloqueante del v1. Esto ya era la recomendación de la sesión anterior y esta sesión no encontró nada que la cambie — al contrario, confirma que el dato de CENEPRED sí es alcanzable técnicamente pero sigue sin licencia.
