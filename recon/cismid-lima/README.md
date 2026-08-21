# Recon: mapa de riesgo sismico de Lima Metropolitana (CISMID-UNI)

Fecha: 2026-08-21 · Objetivo: replicar la capa de Lima manzana por manzana desde
fuentes abiertas, sin depender del permiso de CENEPRED.

## Veredicto

**Build it.** La capa completa de Lima Metropolitana esta publicada como PDF
vectorial georreferenciado, sin token, sin login y sin pedirle permiso a nadie.
No hace falta SIGRID.

El PDF de riesgo sismico del CISMID no es una imagen: es un export de ArcMap con
**86,826 poligonos en 52 distritos** de Lima y Callao, en WGS 84 / UTM 18S, con
el nivel de dano recuperable por color de relleno.

Eso es **132 veces mas granular** que los 658 poligonos de la capa gateada de
SIGRID (5030402) que el proyecto venia esperando desde la primera sesion.

## Terreno

**F, variante documento georreferenciado.** No hay backend que interrogar: el
dato viaja dentro del PDF. La senal que lo delata es `Creator: Esri` en
`pdfinfo` mas la presencia de `NEATLINE` y un CRS en `gdalinfo`.

## Lo observado

Todo lo de esta seccion se corrio y se midio. Nada es inferencia.

### Los dos PDFs

| | Riesgo sismico | Microzonificacion |
|---|---|---|
| URL | `/2026/06/R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf` | `/2026/07/Mapa_Microzonificacion.pdf` |
| HTTP | 200, 5.5 MB | 200, 22 MB |
| Creador | Esri ArcMap 10.8.1 | Esri ArcGIS Pro 3.6.3 |
| Fecha | 2022-02-26 | 2026-08-12 |
| CRS | WGS 84 / UTM 18S | WGS 84 / UTM 18S |
| Capas vectoriales | 57 (52 utiles) | 36 (1 util) |
| Poligonos | **86,826** | 648 |
| Clasificacion por color | **si, 5 niveles** | **no, todo blanco** |

### El PDF de riesgo: lo que sirve

52 capas, una por distrito, con financiador y ano de estudio en el nombre:

```
Zona_Estudio_CISMID-MVCS_VILLA_EL_SALVADOR_-_2010
Zona_Estudio_CISMID-MEF_SAN_ISIDRO_-_2019
Zona_Estudio_CISMID-CENEPRED_BRENA_-_2012
```

Cobertura: 2010 a 2021. Financiadores MVCS, MEF y CENEPRED. La procedencia
viaja en el nombre de la capa, que es exactamente lo que el proyecto necesita
para citar la fuente por distrito.

**Los cinco colores mapean uno a uno contra la tabla de niveles del CISMID:**

| Color | Nivel | Descripcion | Costo reparacion | Riesgo |
|---|---|---|---|---|
| `#267300` | I | Sin dano o superficial | < 15% | Bajo |
| `#55FF00` | II | Dano leve | 15-30% | Bajo |
| `#FFFF00` | III | Dano moderado | 30-60% | Moderado |
| `#FFAA00` | IV | Dano severo | 60-85% | Moderado |
| `#FF0000` | V | Colapso | > 85% | Alto |

### La verificacion que importa

No alcanza con que la extraccion corra: tiene que reproducir el patron que el
CISMID describe en prosa. Contraste medido:

| Distrito | Poligonos | Rojo (V) | Verde (I+II) |
|---|---|---|---|
| Villa El Salvador | 3,072 | 58% | 3% |
| San Juan de Lurigancho | 7,676 | 45% | 24% |
| San Isidro | 671 | 1.6% | 80% |

El CISMID lista a Villa El Salvador y San Juan de Lurigancho entre los distritos
de mayor exposicion. San Isidro no aparece. La extraccion lo reproduce sin que
nadie se lo dijera: **es la prueba de que los colores se estan leyendo bien**,
no solo de que el comando termino sin error.

### El PDF de microzonificacion: lo que NO sirve

La capa `Zona_Estudio_Map_Frame_Zona_Estudio_Microzonificacion_Sismica` tiene
648 poligonos, casi los mismos 658 de SIGRID 5030402. Pero **todas las capas
reportan `BRUSH(fc:#FFFFFF)`**: el relleno de color no lo expone el driver de
OGR, probablemente por patrones o grupos de transparencia de ArcGIS Pro 3.6.

Da geometria sin clasificacion. Para tipo de suelo por zona, este PDF por si
solo no alcanza.

## Como se reproduce

```bash
brew install gdal

curl -sLO https://www.cismid.uni.edu.pe/wp-content/uploads/2026/06/R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf

# listar los 52 distritos
ogrinfo -so R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf | grep "Zona_Estudio_CISMID"

# geometria de un distrito, reproyectada a WGS84
ogr2ogr -f GeoJSON -t_srs EPSG:4326 ves.geojson \
  R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf \
  "Zona_Estudio_CISMID-MVCS_VILLA_EL_SALVADOR_-_2010"

# el nivel de dano, por color
ogrinfo -al R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf \
  "Zona_Estudio_CISMID-MVCS_VILLA_EL_SALVADOR_-_2010" \
  | grep -oE "BRUSH\(fc:#[0-9A-Fa-f]+\)" | sort | uniq -c
```

`ogr2ogr` NO conserva el estilo en GeoJSON: la geometria sale por un lado y el
color por otro. Unirlos requiere leer ambos en el mismo orden de features, que
es el trabajo real de la ingesta.

## Needs verification

- **El pareo geometria-color asume orden estable de features.** Se verifico que
  ambos comandos devuelven el mismo Feature Count por capa, no que el i-esimo
  poligono corresponda al i-esimo estilo. Confirmar leyendo ambos en una sola
  pasada con los bindings de GDAL antes de ingerir.
- **Licencia.** El PDF es de descarga publica desde el sitio institucional del
  CISMID-UNI, sin muro ni terminos en la pagina. No se encontro una licencia
  explicita. Publicacion estatal financiada con fondos publicos (PREVAED, MVCS,
  MEF, CENEPRED). **Corresponde escribir a CISMID citando el uso**, igual que se
  hizo con el IGP: la licencia permisiva es probable, documentarlo es lo correcto.
- **Precision del vertice.** Coordenadas UTM con ~9 decimales; no se midio el
  error real contra un shapefile de referencia.
- **VIRVI ALB** (`/virvi/form`) no se investigo. Es evaluacion de una vivienda
  individual por formulario, no una capa. Fuera del objetivo.

## El gate de SIGRID: ya no importa

Estado sin cambios y sin tocarlo: capa 5030402, token ArcGIS acunado server-side
validado contra header `Referer`, `generateToken` documentado exige usuario y
contrasena, sin licencia ni terminos publicados. Contacto
`soporte-sigrid@cenepred.gob.pe`.

**No se intento evadirlo, y ya no hace falta.** SIGRID ofrece 658 poligonos de
microzonificacion; el PDF publico del CISMID ofrece 86,826 poligonos de riesgo
sismico con clasificacion, que es la capa mas rica de las dos y ademas la que el
proyecto no tenia.

Recomendacion: **cerrar el pedido a CENEPRED por innecesario** y redirigir el
correo al CISMID-UNI, que es el autor real del estudio, para documentar el uso.

## Proximo paso

`cli-build` sobre la ingesta: 52 capas -> tabla `lima_riesgo_features` con
`district`, `funder`, `study_year`, `damage_level`, `geom`. El pareo
geometria-color es el unico punto tecnico abierto.
