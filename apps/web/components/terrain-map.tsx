"use client";

import { SOIL_COLORS, SOIL_LEGEND } from "@sismo/terrain";
import type * as MapLibreGL from "maplibre-gl";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  Map as MapCanvas,
  MapClusterLayer,
  MapControls,
  MapGeoJSON,
} from "./ui/map";

const soilFillColor = [
  "match",
  ["get", "suelo"],
  ...SOIL_LEGEND.flatMap((entry) => [entry.soil, SOIL_COLORS[entry.soil]]),
  SOIL_COLORS.otro,
] as unknown as MapLibreGL.ExpressionSpecification;

const PERU_CENTER: [number, number] = [-76.5, -10.5];

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
          className="h-[28rem] w-full sm:h-[34rem]"
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
        </MapCanvas>
        {hovered ? (
          <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-background-100/95 px-2 py-1 font-mono text-[11px] text-gray-1000 shadow-sm">
            {hovered}
          </div>
        ) : null}
      </div>

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
