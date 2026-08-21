# Ingesta del mapa de riesgo sísmico de Lima (CISMID)

Reproduce la capa `lima_riesgo_features` desde cero. Corre una vez: el PDF del
CISMID se actualiza cada varios años, no a diario.

## Por qué hay un script de Python acá

El resto del repo es TypeScript. Este paso no: la extracción necesita GDAL, que
es la única herramienta que lee un PDF de ArcGIS como fuente vectorial
georreferenciada y expone el estilo de relleno de cada feature. El color ES el
dato (el nivel de daño no viaja como atributo), así que sin acceso al estilo no
hay ingesta posible.

## Requisitos

```bash
brew install gdal tippecanoe
pip3 install --break-system-packages gdal==$(gdal-config --version)
```

## Pasos

```bash
# 1. bajar el PDF publicado por el CISMID
curl -sLO https://www.cismid.uni.edu.pe/wp-content/uploads/2026/06/R01_RIESGO_SISMICO_LIMA_A0-ultimo.pdf

# 2. extraer los 52 layers de distrito a GeoJSON (WGS84)
python3 scripts/extract-lima-risk.py     # escribe lima-riesgo.geojson

# 3. cargar a Neon
#    (ver el bloque SQL abajo; se hace por lotes de 10k, el compute de Neon
#     se queda sin buffers si se le mandan 86k geometrías de una)

# 4. generar y subir los tiles
tippecanoe -o lima-riesgo.mbtiles -l riesgo -Z9 -z15 \
  --drop-densest-as-needed --extend-zooms-if-still-dropping \
  --no-tile-compression --force lima-riesgo.geojson
# extraer el mbtiles a z/x/y.mvt (ojo: mbtiles usa TMS, hay que invertir la Y)
aws s3 sync tiles-lima/ s3://sismo-tiles/lima/riesgo/ \
  --endpoint-url "$AWS_ENDPOINT_URL" \
  --content-type "application/vnd.mapbox-vector-tile" \
  --cache-control "public, max-age=31536000, immutable"
```

## Trampas medidas

- **`ST_MakeValid` puede devolver líneas.** Algunos polígonos del PDF son
  degenerados y colapsan a MultiLineString, que no entra en una columna
  `geometry(MultiPolygon)`. Se filtran con `ST_CollectionExtract(..., 3)`. En la
  corrida de 2026-08-21 fueron 19 de 86,811.
- **El compute de Neon se queda sin buffers** convirtiendo 86k geometrías en una
  sola sentencia. Cargar a una tabla de staging primero y convertir por lotes.
- **mbtiles guarda la Y en TMS**, invertida respecto de la convención `z/x/y` que
  espera MapLibre: `y = (1 << z) - 1 - tile_row`.
- **Los tiles van a R2, no al repo.** Son 25 MB.

## Verificación

La extracción es correcta si reproduce el ranking de exposición que el CISMID
describe en prosa. Contraste medido:

| Distrito | Manzanas | Nivel V | Niveles I-II |
|---|---|---|---|
| Villa El Salvador | 3,071 | 57.7% | 3.2% |
| San Juan de Lurigancho | 7,672 | 44.5% | 24.0% |
| San Isidro | 671 | 1.6% | 80.3% |

El CISMID lista a Villa El Salvador y San Juan de Lurigancho entre los distritos
de mayor exposición y no menciona a San Isidro. Si una corrida futura no
reproduce ese orden, la lectura de color se rompió.
