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

## Paso obligatorio: resolver solapamientos

Los estudios se hicieron distrito por distrito en años distintos, y los vecinos
se pisan en los bordes. Medido sobre la ingesta cruda de 2026-08-21: **7,696
pares de polígonos solapados, 24.29 km²**, el 4.2% de la capa. Los peores:
Pachacamac 2018 contra Villa María del Triunfo 2019 (1,643 pares) y Lurín 2013
contra Pachacamac 2018 (1,237).

Sin resolverlo el mapa se ve sucio (dos colores translúcidos superpuestos) y,
peor, un click puede devolver el polígono equivocado.

**Regla: gana el estudio más reciente.** Un estudio posterior revisa al
anterior, así que el viejo cede el área compartida.

```sql
-- respaldo antes de tocar nada
ALTER TABLE lima_riesgo_features ADD COLUMN geom_raw geometry(MultiPolygon,4326);
UPDATE lima_riesgo_features SET geom_raw = geom;

-- plan: por cada polígono, la unión de todos los que le ganan
CREATE TABLE clip_plan AS
SELECT a.id AS victim_id, ST_UnaryUnion(ST_Collect(b.geom_raw)) AS winner_geom
FROM lima_riesgo_features a
JOIN lima_riesgo_features b
  ON a.id <> b.id AND a.geom_raw && b.geom_raw
 AND (b.study_year, b.id) > (a.study_year, a.id)
 AND ST_Area(ST_Intersection(a.geom_raw, b.geom_raw)) > 1e-12
GROUP BY a.id;

-- aplicar por lotes de 500 (el compute de Neon no aguanta todo junto)
UPDATE lima_riesgo_features f SET geom = sub.g
FROM (SELECT c.victim_id AS id,
             ST_CollectionExtract(ST_MakeValid(ST_Difference(f2.geom_raw, c.winner_geom)),3) AS g
      FROM clip_plan c JOIN lima_riesgo_features f2 ON f2.id=c.victim_id
      WHERE c.rn > :lo AND c.rn <= :hi) sub
WHERE f.id = sub.id;

DELETE FROM lima_riesgo_features WHERE ST_IsEmpty(geom);
```

Resultado medido: **0 pares solapados, 0 m²**. Quedan 84,784 polígonos (se
borran 2,008 que un estudio posterior cubrió por completo) y 552 km².

**El predicado importa.** Un primer intento usó `ST_Overlaps`, que en PostGIS
es **falso** cuando un polígono contiene a otro o cuando solo comparten borde.
El plan nunca incluyó esos casos y el solapamiento apenas bajó de 7,696 a 5,661.
La condición correcta es `ST_Area(ST_Intersection(...)) > 0`.

El recorte no cambia el criterio de aceptación: Villa El Salvador sigue en 57.7%
nivel V y San Isidro en 1.6%. Solo toca bordes entre distritos.

## Contorno de distrito para la UI

`store.outlines()` no hace `ST_Union` directo de las manzanas: eso deja un hueco
por cada calle. Medido en Villa El Salvador daba **3,058 anillos**, y dibujarlos
todos con línea gruesa pinta el distrito de negro en vez de bordearlo. Con un
buffer de ~66 m antes de unir y otro negativo después quedan **4 anillos y 138
puntos** en una sola pieza.

## Precalcular contornos y estadísticas (obligatorio, es performance)

`store.outlines()` lee `lima_riesgo_outlines`. Calcular esos contornos al vuelo
cuesta **3.5 s medidos** y era la causa de un TTFB de 2.3 s en `/terreno/lima`.
Correr después de cada ingesta o recorte:

```sql
DROP TABLE IF EXISTS lima_riesgo_outlines;
CREATE TABLE lima_riesgo_outlines AS
SELECT district,
       ST_SimplifyPreserveTopology(
         ST_Buffer(ST_Union(ST_Buffer(geom, 0.0006)), -0.0004), 0.0002) AS geom,
       ST_XMin(ST_Extent(geom)) AS min_lon, ST_YMin(ST_Extent(geom)) AS min_lat,
       ST_XMax(ST_Extent(geom)) AS max_lon, ST_YMax(ST_Extent(geom)) AS max_lat
FROM lima_riesgo_features GROUP BY district;
ALTER TABLE lima_riesgo_outlines ADD PRIMARY KEY (district);
```

La misma razón vale para las estadísticas por distrito. Agrupar y sumar
`ST_Area(geom::geography)` sobre las 84 mil manzanas cuesta **930 ms** medidos
con `EXPLAIN ANALYZE`; leer la tabla precalculada cuesta **0.04 ms**.

```sql
ALTER TABLE lima_riesgo_features ADD COLUMN IF NOT EXISTS area_m2 double precision;
UPDATE lima_riesgo_features SET area_m2 = ST_Area(geom::geography) WHERE area_m2 IS NULL;

DROP TABLE IF EXISTS lima_riesgo_stats;
CREATE TABLE lima_riesgo_stats AS
SELECT district, funder, study_year,
       count(*)::int AS total,
       count(*) FILTER (WHERE level=1)::int AS l1,
       count(*) FILTER (WHERE level=2)::int AS l2,
       count(*) FILTER (WHERE level=3)::int AS l3,
       count(*) FILTER (WHERE level=4)::int AS l4,
       count(*) FILTER (WHERE level=5)::int AS l5,
       round((sum(area_m2)/1e6)::numeric,2)::float8 AS area_km2
FROM lima_riesgo_features GROUP BY district, funder, study_year;
ALTER TABLE lima_riesgo_stats ADD PRIMARY KEY (district);
```

**Las tres consultas de la página leen tablas precalculadas.** Un primer intento
solo precalculó los contornos y el TTFB no mejoró: `districts()` y `totals()`
seguían recorriendo las 84 mil geometrías. Medir cada consulta por separado fue
lo que lo delató.
