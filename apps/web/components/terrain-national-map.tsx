"use client";

import {
  GEOMORPH_COLORS,
  GEOMORPH_LEGEND,
  INGEMMET_TILE_ATTRIBUTION,
  TERRAIN_TILE_URL_TEMPLATE,
  TILE_MAX_ZOOM,
  TILE_MIN_ZOOM,
} from "@sismo/terrain";
import type * as MapLibreGL from "maplibre-gl";
import { useTheme } from "next-themes";
import { Map as MapCanvas, MapControls, MapVectorTile } from "./ui/map";

const geomorphFillColor = [
  "match",
  ["get", "subunidad_cat"],
  ...GEOMORPH_LEGEND.flatMap((entry) => [
    entry.category,
    GEOMORPH_COLORS[entry.category],
  ]),
  GEOMORPH_COLORS.otro,
] as unknown as MapLibreGL.ExpressionSpecification;

const PERU_CENTER: [number, number] = [-76.5, -10.5];

/**
 * Capa nacional de geomorfología (INGEMMET/GEOCATMIN, 62,109 polígonos
 * agrupados en 11 categorías), servida desde vector tiles pregenerados por
 * `scripts/build-terrain-tiles.ts`. Cubre el país entero, a diferencia de la
 * capa de zonificación sísmica del IGP (`TerrainMap`), que solo cubre 57
 * ciudades con estudio publicado.
 *
 * Componente separado de `TerrainMap` (que ya compone suelo IGP + sismos):
 * la fuente de datos, la escala (nacional vs. urbana) y el criterio de color
 * (forma del terreno vs. rigidez del suelo) son distintos, y mezclar ambas
 * capas en un mismo choropleth confundiría la leyenda. Ver
 * `04_Projects/.../HANDOFF` para el plan de fusionarlos en un selector de
 * capas dentro de `TerrainMap`.
 */
export function TerrainNationalMap() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="space-y-2" data-testid="terrain-national-map">
      <div className="relative overflow-hidden rounded-lg border border-gray-200">
        <MapCanvas
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          className="h-[28rem] w-full sm:h-[34rem]"
          center={PERU_CENTER}
          zoom={5}
        >
          <MapControls />
          <MapVectorTile
            tiles={TERRAIN_TILE_URL_TEMPLATE}
            sourceLayer="geomorfologia"
            minzoom={TILE_MIN_ZOOM}
            maxzoom={TILE_MAX_ZOOM}
            fillPaint={{ "fill-color": geomorphFillColor, "fill-opacity": 0.6 }}
            linePaint={{ "line-color": "#00000022", "line-width": 0.3 }}
          />
        </MapCanvas>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-900">
        {GEOMORPH_LEGEND.map((entry) => (
          <span key={entry.category} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: GEOMORPH_COLORS[entry.category] }}
            />
            {entry.label}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-gray-800">
        Geomorfología nacional. Fuente: {INGEMMET_TILE_ATTRIBUTION}, con
        licencia de reuso otorgada por escrito el 2026-08-20. INGEMMET no es
        responsable de los productos derivados ni de las interpretaciones hechas
        en esta plataforma. Fondo cartográfico de CARTO y OpenStreetMap.
      </p>
    </div>
  );
}
