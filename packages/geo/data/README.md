# Límites administrativos

## Perú

`peru-departamentos.json` (25) y `peru-provincias.json` (197) derivan de
https://github.com/juaneladio/peru-geojson (límites INEI simplificados, de uso
público y ampliamente redistribuidos). Coordenadas redondeadas a 3 decimales
(~111 m) y propiedades reducidas a `name` por este proyecto. Uso: fondo
cartográfico del mapa SVG server-side y evaluación punto-en-polígono de
departamentos en Verifica. No son los límites oficiales exactos. Para países,
Verifica usa los límites Natural Earth distribuidos por `world-atlas`.

## Colombia

`colombia-departamentos.json` contiene los 32 departamentos y Bogotá D.C. Deriva de
[`geoBoundaries-COL-ADM1`](https://www.geoboundaries.org/api/current/gbOpen/COL/ADM1/),
release `gbOpen` fijado al commit `9469f09`, bajo CC BY 4.0. La fuente declara OpenStreetMap
como origen cartográfico. La geometría fue simplificada al 8%, preservando cada forma, con
coordenadas redondeadas a 3 decimales y propiedades reducidas a `name`.
