"use client";

import {
  GEOMORPH_COLORS,
  GEOMORPH_LEGEND,
  SOIL_COLORS,
  SOIL_LEGEND,
  TERRAIN_TILE_URL_TEMPLATE,
  TILE_MAX_ZOOM,
  TILE_MIN_ZOOM,
} from "@sismo/terrain";
import type * as MapLibreGL from "maplibre-gl";
import { useTheme } from "next-themes";
import { Map as MapCanvas, MapGeoJSON, MapVectorTile } from "./ui/map";

const soilFillColor = [
  "match",
  ["get", "suelo"],
  ...SOIL_LEGEND.flatMap((entry) => [entry.soil, SOIL_COLORS[entry.soil]]),
  SOIL_COLORS.otro,
] as unknown as MapLibreGL.ExpressionSpecification;

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
 * El preview del IGP no puede mostrar el pais entero. Medido 2026-08-21 contra
 * la base: la capa `igp-wfs-zonificacion` suma 802 km2, el 0.06% del territorio
 * peruano, repartidos en manchas urbanas de pocos kilometros. A zoom 5 esos
 * poligonos ocupan una fraccion de pixel y la tarjeta se ve negra: no es la
 * rampa de color, es la escala. INGEMMET si se ve a zoom 5 porque cubre
 * 1,287,041 km2, 1600 veces mas superficie.
 *
 * Se encuadra el conjunto Piura / Castilla / Sullana / Union, el cluster con
 * mas area publicada (bbox medido 0.199 lon x 0.534 lat). Lima Metropolitana
 * no sirve de encuadre: el IGP no cubre ninguno de sus distritos.
 */
const IGP_PREVIEW_CENTER: [number, number] = [-80.68, -5.15];
const IGP_PREVIEW_ZOOM = 8.5;

/**
 * Previsualización chica y sin interacción del mapa de suelos del IGP o de
 * geomorfología nacional (INGEMMET), para usar dentro de una tarjeta de
 * entrada. `interactive={false}` apaga scroll/drag/dblclick de MapLibre: no
 * hay controles, no hay estado de zoom que mantener, es solo la imagen del
 * mapa. Reutiliza las mismas fuentes que las páginas completas
 * (`/terreno/mapa` vía `/api/v1/terreno`, `/terreno/geomorfologia` vía los
 * vector tiles de R2) para no duplicar payload ni mantener un snapshot
 * aparte.
 */
export function TerrainPreviewMap({ kind }: { kind: "igp" | "geomorfologia" }) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div
      className="pointer-events-none h-32 w-full overflow-hidden rounded-md border border-gray-200 sm:h-40"
      data-testid={`terrain-preview-map-${kind}`}
      aria-hidden="true"
    >
      <MapCanvas
        theme={theme}
        className="h-full w-full"
        center={kind === "igp" ? IGP_PREVIEW_CENTER : PERU_CENTER}
        zoom={kind === "igp" ? IGP_PREVIEW_ZOOM : 5}
        interactive={false}
        attributionControl={false}
      >
        {kind === "igp" ? (
          <MapGeoJSON
            data="/api/v1/terreno"
            fillPaint={{ "fill-color": soilFillColor, "fill-opacity": 0.6 }}
            linePaint={false}
          />
        ) : (
          <MapVectorTile
            tiles={TERRAIN_TILE_URL_TEMPLATE}
            sourceLayer="geomorfologia"
            minzoom={TILE_MIN_ZOOM}
            maxzoom={TILE_MAX_ZOOM}
            fillPaint={{
              "fill-color": geomorphFillColor,
              "fill-opacity": 0.6,
            }}
            linePaint={false}
          />
        )}
      </MapCanvas>
    </div>
  );
}
