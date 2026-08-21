"use client";

import {
  LIMA_CENTER,
  LIMA_RISK_MAX_ZOOM,
  LIMA_RISK_MIN_ZOOM,
  LIMA_RISK_SOURCE_LAYER,
  LIMA_RISK_TILE_URL_TEMPLATE,
  RISK_LEVELS,
  riskLevelSpec,
  romanLevel,
  whatItMeans,
} from "@sismo/terrain";
import type * as MapLibreGL from "maplibre-gl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Map as MapCanvas,
  MapControls,
  MapPopup,
  MapVectorTile,
  useMap,
} from "./ui/map";

/**
 * El mapa interactivo de riesgo sísmico de Lima.
 *
 * Lo que este componente hace y el PDF no puede: el nivel de daño viaja dentro
 * del vector tile como atributo, así que un click lo resuelve en el cliente sin
 * ida al servidor. En el PDF la misma pregunta ("¿qué nivel es mi manzana?")
 * exige descargar 5.5 MB, hacer zoom en un A1 y comparar un color contra una
 * leyenda impresa a diez centímetros de distancia.
 */

const fillColor = [
  "match",
  ["get", "level"],
  ...RISK_LEVELS.flatMap((spec) => [spec.level, spec.ui]),
  "#9ca3af",
] as unknown as MapLibreGL.ExpressionSpecification;

interface HoverState {
  lon: number;
  lat: number;
  level: number;
  district: string;
  studyYear: number;
}

function ClickInspector({
  onPick,
}: {
  onPick: (state: HoverState | null) => void;
}) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const handleClick = (e: MapLibreGL.MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(e.point);
      const hit = hits.find((feature) =>
        String(feature.layer.id).includes("lima-riesgo"),
      );
      if (!hit) {
        onPick(null);
        return;
      }
      const props = hit.properties ?? {};
      onPick({
        lon: e.lngLat.lng,
        lat: e.lngLat.lat,
        level: Number(props.level),
        district: String(props.district ?? ""),
        studyYear: Number(props.year ?? props.study_year ?? 0),
      });
    };

    // El cursor es la única señal de que el mapa es interrogable. Sin esto la
    // gente asume que es una imagen, que es exactamente el problema del PDF.
    const handleMove = (e: MapLibreGL.MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(e.point);
      const over = hits.some((feature) =>
        String(feature.layer.id).includes("lima-riesgo"),
      );
      map.getCanvas().style.cursor = over ? "pointer" : "";
    };

    map.on("click", handleClick);
    map.on("mousemove", handleMove);
    return () => {
      map.off("click", handleClick);
      map.off("mousemove", handleMove);
    };
  }, [map, onPick]);

  return null;
}

export function LimaRiskMap({
  initialCenter,
  initialZoom,
  className,
}: {
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const [picked, setPicked] = useState<HoverState | null>(null);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  const handlePick = useCallback((state: HoverState | null) => {
    setPicked(state);
  }, []);

  const spec = picked ? riskLevelSpec(picked.level) : null;

  // Atenuar en vez de ocultar. Un filtro que borra los otros niveles deja al
  // usuario sin referencia de dónde está mirando; bajar la opacidad mantiene
  // la silueta de la ciudad mientras resalta el nivel elegido.
  const fillOpacity = useMemo(() => {
    if (activeLevel === null) {
      return [
        "interpolate",
        ["linear"],
        ["zoom"],
        9,
        0.75,
        13,
        0.85,
      ] as unknown as number;
    }
    return [
      "case",
      ["==", ["get", "level"], activeLevel],
      0.9,
      0.06,
    ] as unknown as number;
  }, [activeLevel]);

  return (
    <div className={className}>
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-gray-300">
        <MapCanvas
          theme={theme}
          className="h-full w-full"
          center={initialCenter ?? LIMA_CENTER}
          zoom={initialZoom ?? 10.2}
          attributionControl={false}
        >
          <MapVectorTile
            id="lima-riesgo"
            tiles={LIMA_RISK_TILE_URL_TEMPLATE}
            sourceLayer={LIMA_RISK_SOURCE_LAYER}
            minzoom={LIMA_RISK_MIN_ZOOM}
            maxzoom={LIMA_RISK_MAX_ZOOM}
            fillPaint={{
              "fill-color": fillColor,
              "fill-opacity": fillOpacity,
            }}
            linePaint={{
              "line-color": "#00000022",
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                12,
                0,
                15,
                0.5,
              ] as unknown as number,
            }}
          />
          <MapControls />
          <ClickInspector onPick={handlePick} />
          {picked && spec ? (
            <MapPopup
              longitude={picked.lon}
              latitude={picked.lat}
              closeButton
              offset={14}
              onClose={() => setPicked(null)}
            >
              <div className="max-w-[15rem] space-y-2 pr-4">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: spec.ui }}
                  />
                  <p className="font-semibold text-sm text-gray-1000">
                    Nivel {romanLevel(spec.level)} · {spec.damage}
                  </p>
                </div>
                <p className="text-xs text-gray-900 leading-relaxed">
                  {whatItMeans(spec.level)}
                </p>
                <dl className="space-y-0.5 text-[11px] text-gray-800">
                  <div className="flex justify-between gap-3">
                    <dt>Costo de reparación</dt>
                    <dd className="font-medium text-gray-1000">
                      {spec.repairCost}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Distrito</dt>
                    <dd className="font-medium text-gray-1000">
                      {picked.district}
                    </dd>
                  </div>
                  {picked.studyYear ? (
                    <div className="flex justify-between gap-3">
                      <dt>Estudio</dt>
                      <dd className="font-medium text-gray-1000">
                        {picked.studyYear}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <p className="border-gray-300 border-t pt-1.5 text-[10px] text-gray-700 leading-snug">
                  Estimación por zona. No reemplaza una evaluación técnica de tu
                  vivienda.
                </p>
              </div>
            </MapPopup>
          ) : null}
        </MapCanvas>

        <div className="pointer-events-none absolute top-3 left-3 rounded-md bg-map-paper/90 px-2.5 py-1.5 text-[11px] text-gray-900 shadow-sm backdrop-blur">
          Tocá cualquier manzana para ver su nivel
        </div>
      </div>

      <fieldset className="mt-3">
        <legend className="sr-only">Filtrar por nivel de daño</legend>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveLevel(null)}
            aria-pressed={activeLevel === null}
            className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
              activeLevel === null
                ? "border-gray-1000 bg-gray-1000 text-map-paper"
                : "border-gray-300 text-gray-900 hover:border-gray-500"
            }`}
          >
            Todos
          </button>
          {RISK_LEVELS.map((spec) => (
            <button
              key={spec.level}
              type="button"
              onClick={() =>
                setActiveLevel(activeLevel === spec.level ? null : spec.level)
              }
              aria-pressed={activeLevel === spec.level}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                activeLevel === spec.level
                  ? "border-gray-1000 text-gray-1000"
                  : "border-gray-300 text-gray-900 hover:border-gray-500"
              }`}
            >
              <span
                aria-hidden
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: spec.ui }}
              />
              {romanLevel(spec.level)}
              <span className="hidden sm:inline">· {spec.damage}</span>
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
