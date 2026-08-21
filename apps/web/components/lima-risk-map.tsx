"use client";

import {
  type DistrictOutline,
  LIMA_CENTER,
  LIMA_RISK_MAX_ZOOM,
  LIMA_RISK_MIN_ZOOM,
  LIMA_RISK_SOURCE_LAYER,
  LIMA_RISK_TILE_URL_TEMPLATE,
  RISK_LEVELS,
  riskLevelSpec,
  romanLevel,
  SOIL_COLORS,
  SOIL_LEGEND,
  whatItMeans,
} from "@sismo/terrain";
import type * as MapLibreGL from "maplibre-gl";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Map as MapCanvas,
  MapClusterLayer,
  MapControls,
  MapGeoJSON,
  MapMarker,
  MapPopup,
  MapVectorTile,
  MarkerContent,
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

/**
 * La capa del IGP mide otra cosa: el tipo de suelo, no el daño esperado a la
 * vivienda. En el este de Lima las dos se superponen (medido: 2,958 pares en
 * Huaycán/Ate, 1,377 en Chosica), y ahí es donde comparar sirve: el mismo
 * territorio con un estudio de suelo y uno de vulnerabilidad encima.
 */
const soilFillColor = [
  "match",
  ["get", "suelo"],
  ...SOIL_LEGEND.flatMap((entry) => [entry.soil, SOIL_COLORS[entry.soil]]),
  SOIL_COLORS.otro,
] as unknown as MapLibreGL.ExpressionSpecification;

interface PickedFeature {
  lon: number;
  lat: number;
  level: number;
  district: string;
  studyYear: number;
}

function ClickInspector({
  onPick,
}: {
  onPick: (state: PickedFeature | null) => void;
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

/**
 * Mueve la cámara. Separado porque `useMap` exige estar dentro del canvas.
 *
 * Una dirección concreta gana sobre el distrito: si alguien buscó su casa,
 * quiere ver su cuadra, no el distrito entero.
 */
function FlyTo({
  outline,
  address,
  token,
}: {
  outline: DistrictOutline | null;
  address: { lon: number; lat: number } | null;
  /**
   * Cambia solo cuando la persona pidió explícitamente moverse: eligió un
   * distrito en la lista o una dirección en el buscador. Un click sobre el
   * mapa también selecciona distrito, pero no incrementa el token, así que la
   * cámara se queda donde estaba.
   */
  token: number;
}) {
  const { map, isLoaded } = useMap();
  const lastToken = useRef(0);

  useEffect(() => {
    if (!map || !isLoaded) return;
    // Sin esto, hacer click en una manzana con el mapa en zoom 15 disparaba un
    // fitBounds al distrito entero y le sacaba a la persona el zoom que acababa
    // de elegir a mano. La cámara solo se mueve cuando se lo piden.
    if (token === lastToken.current) return;
    lastToken.current = token;

    if (address) {
      map.easeTo({
        center: [address.lon, address.lat],
        zoom: Math.max(map.getZoom(), 15.5),
        duration: 1000,
      });
      return;
    }
    if (!outline) {
      map.easeTo({ center: LIMA_CENTER, zoom: 10.2, duration: 700 });
      return;
    }
    map.fitBounds(outline.bounds, {
      padding: { top: 40, bottom: 40, left: 40, right: 40 },
      duration: 900,
      maxZoom: 14,
    });
  }, [map, isLoaded, outline, address, token]);

  return null;
}

export function LimaRiskMap({
  outlines,
  selectedDistrict,
  onSelectDistrict,
  activeLevels,
  onActiveLevelsChange,
  levelTotals,
  address,
  flyToken,
  quakesUrl,
}: {
  outlines: DistrictOutline[];
  selectedDistrict?: string | null;
  onSelectDistrict?: (district: string | null) => void;
  activeLevels: string[];
  onActiveLevelsChange: (levels: string[]) => void;
  /** Conteo por nivel, índice 0 = nivel 1. Va en cada toggle. */
  levelTotals: number[];
  address?: { lon: number; lat: number; label: string } | null;
  /** Se incrementa cuando la persona elige distrito o dirección; ver `FlyTo`. */
  flyToken: number;
  /** Sismos recientes del IGP, para superponerlos. */
  quakesUrl?: string;
}) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const [picked, setPicked] = useState<PickedFeature | null>(null);
  const [showSoil, setShowSoil] = useState(false);
  const [showQuakes, setShowQuakes] = useState(false);

  const handlePick = useCallback(
    (state: PickedFeature | null) => {
      setPicked(state);
      // Tocar una manzana también selecciona su distrito: es el gesto natural
      // cuando alguien busca el suyo y no sabe cómo se escribe.
      if (state && onSelectDistrict) onSelectDistrict(state.district);
    },
    [onSelectDistrict],
  );

  /**
   * El popup muere cuando la selección cambia desde afuera del mapa.
   *
   * Sin esto: tocás Surquillo en el mapa, después elegís Villa María del
   * Triunfo en la lista, y el popup de Surquillo sigue abierto sobre un mapa
   * que ya voló a otro distrito. El popup describe una manzana concreta, así
   * que en cuanto la vista deja de ser la de esa manzana, deja de ser cierto.
   */
  const lastDistrict = useRef(selectedDistrict);
  useEffect(() => {
    if (lastDistrict.current === selectedDistrict) return;
    lastDistrict.current = selectedDistrict;
    setPicked((current) =>
      current && current.district !== selectedDistrict ? null : current,
    );
  }, [selectedDistrict]);

  const spec = picked ? riskLevelSpec(picked.level) : null;
  const selectedOutline = useMemo(
    () => outlines.find((entry) => entry.district === selectedDistrict) ?? null,
    [outlines, selectedDistrict],
  );

  /**
   * Atenuar en vez de ocultar, en dos ejes que se combinan: el nivel elegido en
   * los toggles y el distrito elegido en el buscador. Un filtro que borra el
   * resto deja a la persona sin referencia de dónde está mirando; bajar la
   * opacidad mantiene la silueta de la ciudad alrededor de lo que resaltó.
   */
  const fillOpacity = useMemo(() => {
    const levels = activeLevels.map(Number);
    const levelMatch: unknown =
      levels.length === 0
        ? true
        : ["in", ["get", "level"], ["literal", levels]];
    const districtMatch: unknown = selectedDistrict
      ? ["==", ["get", "district"], selectedDistrict]
      : true;

    if (levels.length === 0 && !selectedDistrict) {
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
      ["all", levelMatch, districtMatch],
      0.9,
      0.08,
    ] as unknown as number;
  }, [activeLevels, selectedDistrict]);

  return (
    <div>
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-gray-300">
        <MapCanvas
          theme={theme}
          className="h-full w-full"
          center={LIMA_CENTER}
          zoom={10.2}
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
            linePaint={false}
          />

          {selectedOutline ? (
            <MapGeoJSON
              id="lima-distrito-activo"
              data={{
                type: "Feature",
                properties: {},
                geometry: selectedOutline.geometry,
              }}
              fillPaint={false}
              linePaint={{
                "line-color": theme === "dark" ? "#ffffff" : "#111111",
                "line-width": 2.5,
              }}
            />
          ) : null}

          {showSoil ? (
            <MapGeoJSON
              id="lima-suelo-igp"
              data="/api/v1/terreno"
              fillPaint={{
                "fill-color": soilFillColor,
                "fill-opacity": 0.5,
              }}
              linePaint={{ "line-color": "#00000033", "line-width": 0.4 }}
            />
          ) : null}

          {showQuakes && quakesUrl ? (
            <MapClusterLayer data={quakesUrl} clusterRadius={40} />
          ) : null}

          <MapControls />
          <ClickInspector onPick={handlePick} />
          <FlyTo
            outline={selectedOutline}
            address={address ?? null}
            token={flyToken}
          />

          {address ? (
            <MapMarker longitude={address.lon} latitude={address.lat}>
              <MarkerContent>
                <span className="relative flex size-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-1000 opacity-30" />
                  <span className="relative inline-flex size-4 rounded-full border-2 border-map-paper bg-gray-1000 shadow-md" />
                </span>
              </MarkerContent>
            </MapMarker>
          ) : null}

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
                  <p className="font-semibold text-gray-1000 text-sm">
                    Nivel {romanLevel(spec.level)} · {spec.damage}
                  </p>
                </div>
                <p className="text-gray-900 text-xs leading-relaxed">
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

        {!selectedDistrict && !picked ? (
          <div className="pointer-events-none absolute top-3 left-3 rounded-md bg-map-paper/90 px-2.5 py-1.5 text-[11px] text-gray-900 shadow-sm backdrop-blur">
            Tocá cualquier manzana para ver su nivel
          </div>
        ) : null}
      </div>

      {/* Capas encima del mapa: son fuentes distintas midiendo cosas distintas
          sobre el mismo territorio, no variantes del mismo dato. Apagadas por
          defecto para que la primera lectura sea una sola. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="text-gray-800">Superponer:</span>
        <label className="flex cursor-pointer items-center gap-1.5 text-gray-1000">
          <input
            type="checkbox"
            checked={showSoil}
            onChange={(event) => setShowSoil(event.target.checked)}
          />
          Tipo de suelo del IGP
        </label>
        {quakesUrl ? (
          <label className="flex cursor-pointer items-center gap-1.5 text-gray-1000">
            <input
              type="checkbox"
              checked={showQuakes}
              onChange={(event) => setShowQuakes(event.target.checked)}
            />
            Sismos recientes
          </label>
        ) : null}
      </div>

      {/* Los toggles viven debajo del mapa, que es donde se leen contra lo que
          acaban de resaltar. Cada uno lleva su conteo: la leyenda y el filtro
          son la misma cosa, y separarlos obligaba a buscar el número en otro
          lado de la página. */}
      <div className="mt-3">
        <ToggleGroup
          value={activeLevels}
          onValueChange={onActiveLevelsChange}
          variant="outline"
          size="sm"
          aria-label="Resaltar niveles de daño en el mapa"
          className="flex-wrap"
        >
          {RISK_LEVELS.map((spec, index) => {
            const count = levelTotals[index] ?? 0;
            return (
              <ToggleGroupItem
                key={spec.level}
                value={String(spec.level)}
                aria-label={`Nivel ${romanLevel(spec.level)}, ${spec.damage}, ${count} manzanas`}
                className="gap-1.5"
              >
                <span
                  aria-hidden
                  className="size-2.5 rounded-[2px]"
                  style={{ backgroundColor: spec.ui }}
                />
                <span>{romanLevel(spec.level)}</span>
                <span className="hidden sm:inline">{spec.damage}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {count.toLocaleString("es-PE")}
                </span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
    </div>
  );
}
