"use client";

import { SOIL_COLORS, SOIL_LEGEND } from "@sismo/terrain";
import { MousePointerClick } from "lucide-react";
import type * as MapLibreGL from "maplibre-gl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Map as MapCanvas,
  MapClusterLayer,
  MapControls,
  MapGeoJSON,
  MapMarker,
  MapPopup,
  MarkerContent,
  useMap,
} from "./ui/map";

const soilFillColor = [
  "match",
  ["get", "suelo"],
  ...SOIL_LEGEND.flatMap((entry) => [entry.soil, SOIL_COLORS[entry.soil]]),
  SOIL_COLORS.otro,
] as unknown as MapLibreGL.ExpressionSpecification;

const PERU_CENTER: [number, number] = [-76.5, -10.5];

// 4 decimales ≈ 11 metros de precisión, de sobra para ubicar un punto en un
// mapa de zonificación cuyo polígono más chico mide cientos de metros.
const COORDINATE_PRECISION = 4;

// Capas que ya consumen su propio click (clusters de sismos y puntos
// individuales). Si el click cayó en una de estas, el popup de "ver este
// punto" cede el paso al comportamiento propio de la capa (zoom al cluster).
const QUAKE_LAYER_PREFIXES = [
  "clusters-",
  "cluster-count-",
  "unclustered-point-",
];

function formatCoordinate(value: number): string {
  return value.toFixed(COORDINATE_PRECISION);
}

// Notación humana con hemisferio: "12.9879° S" en vez de "-12.9879", que es
// dato crudo sin significado a simple vista. Estándar geográfico, no
// reverse-geocoding: no inventa una referencia que no tenemos.
function formatHumanCoordinate(lat: number, lon: number): string {
  const latHemisphere = lat >= 0 ? "N" : "S";
  const lonHemisphere = lon >= 0 ? "E" : "O";
  return `${Math.abs(lat).toFixed(COORDINATE_PRECISION)}° ${latHemisphere}, ${Math.abs(lon).toFixed(COORDINATE_PRECISION)}° ${lonHemisphere}`;
}

// Escucha clicks crudos del mapa (no de una capa específica) y muestra un
// popup de confirmación antes de navegar a la ficha del punto. Vive como
// componente aparte porque `useMap()` exige estar dentro de `MapContext`,
// que solo existe una vez que `<MapCanvas>` montó su instancia de MapLibre.
function MapClickToPoint() {
  const { map } = useMap();
  const [clicked, setClicked] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!map) return;

    const handleClick = (e: MapLibreGL.MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(e.point);
      const hitQuakeLayer = hits.some((feature) =>
        QUAKE_LAYER_PREFIXES.some((prefix) =>
          String(feature.layer.id).startsWith(prefix),
        ),
      );
      if (hitQuakeLayer) return;

      setClicked([e.lngLat.lng, e.lngLat.lat]);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map]);

  if (!clicked) return null;

  const [lon, lat] = clicked;
  const href = `/terreno/punto?lon=${formatCoordinate(lon)}&lat=${formatCoordinate(lat)}`;

  return (
    <>
      <MapMarker longitude={lon} latitude={lat}>
        <MarkerContent>
          <span className="relative flex size-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-official opacity-40" />
            <span className="relative inline-flex size-3.5 rounded-full border-2 border-map-paper bg-official shadow-md" />
          </span>
        </MarkerContent>
      </MapMarker>
      <MapPopup
        longitude={lon}
        latitude={lat}
        closeButton
        offset={18}
        onClose={() => setClicked(null)}
      >
        <div className="space-y-2 pr-4 text-xs">
          <p className="font-medium text-gray-1000">
            {formatHumanCoordinate(lat, lon)}
          </p>
          <p className="font-mono text-[10px] text-gray-800">
            {formatCoordinate(lat)}, {formatCoordinate(lon)}
          </p>
          <a
            href={href}
            className="inline-flex items-center rounded bg-official px-2 py-1 font-medium text-official-soft hover:opacity-90"
          >
            Ver terreno acá
          </a>
        </div>
      </MapPopup>
    </>
  );
}

export function TerrainMap({
  quakesUrl,
  quakeCount = 0,
  focus,
  zoom = 4.4,
  capturedAt,
}: {
  quakesUrl?: string;
  quakeCount?: number;
  focus?: [number, number];
  zoom?: number;
  capturedAt: string;
}) {
  const { resolvedTheme } = useTheme();
  const [showSoil, setShowSoil] = useState(true);
  const [showQuakes, setShowQuakes] = useState(quakeCount > 0);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="space-y-2" data-testid="terrain-map">
      <div className="relative overflow-hidden rounded-lg border border-gray-200">
        <MapCanvas
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          className="h-[28rem] w-full cursor-pointer sm:h-[34rem]"
          center={focus ?? PERU_CENTER}
          zoom={zoom}
        >
          <MapControls />
          {showSoil ? (
            <MapGeoJSON
              data="/api/v1/terreno"
              promoteId="id"
              fillPaint={{ "fill-color": soilFillColor, "fill-opacity": 0.55 }}
              fillHoverPaint={{ "fill-opacity": 0.85 }}
              linePaint={{ "line-color": "#00000033", "line-width": 0.4 }}
              onHover={(event) => {
                const properties = event?.feature?.properties as
                  | { zona?: string; ciudad?: string }
                  | undefined;
                setHovered(
                  properties?.zona
                    ? `${properties.zona} · ${properties.ciudad ?? ""}`
                    : null,
                );
              }}
            />
          ) : null}
          {showQuakes && quakesUrl ? (
            <MapClusterLayer data={quakesUrl} clusterRadius={40} />
          ) : null}
          <MapClickToPoint />
        </MapCanvas>
        {hovered ? (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-background-100/95 px-2 py-1 font-mono text-[11px] text-gray-1000 shadow-sm">
            {hovered}
          </div>
        ) : null}
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-gray-800">
        <MousePointerClick className="size-3.5 shrink-0 text-gray-700" />
        Hacé click en cualquier punto del mapa para ver la ficha de terreno de
        esa ubicación.
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={showSoil}
            onChange={(event) => setShowSoil(event.target.checked)}
          />
          Tipo de suelo
        </label>
        {quakeCount > 0 ? (
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={showQuakes}
              onChange={(event) => setShowQuakes(event.target.checked)}
            />
            Sismos ({quakeCount})
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-900">
        {SOIL_LEGEND.map((entry) => (
          <span key={entry.soil} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: SOIL_COLORS[entry.soil] }}
            />
            {entry.label}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-gray-800">
        El color ordena rigidez del suelo y período de vibración, no peligro
        para una construcción. Zonificación del IGP, instantánea del{" "}
        {capturedAt.slice(0, 10)}. Fondo cartográfico de CARTO y OpenStreetMap.
      </p>
    </div>
  );
}
