import {
  departamentos,
  type GeoFeature,
  getCountry,
  provincias,
} from "@sismo/geo";

interface Bounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

type MapCountry = "peru" | "colombia";

const BASE_BOUNDS: Record<MapCountry, Bounds> = {
  peru: {
    minLon: -81.6,
    maxLon: -68.4,
    minLat: -18.6,
    maxLat: 0.3,
  },
  colombia: {
    minLon: -79.3,
    maxLon: -66.7,
    minLat: -4.4,
    maxLat: 13.8,
  },
};
const MAX_EXTENSION_DEG = 3;
const MARKER_PADDING_DEG = 0.6;
const WIDTH = 640;

function heightFor(bounds: Bounds): number {
  const lonScale = Math.cos(
    (((bounds.minLat + bounds.maxLat) / 2) * Math.PI) / 180,
  );
  return Math.round(
    (WIDTH * (bounds.maxLat - bounds.minLat)) /
      ((bounds.maxLon - bounds.minLon) * lonScale),
  );
}

function projectWith(
  bounds: Bounds,
  height: number,
  lon: number,
  lat: number,
): [number, number] {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * WIDTH;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

function ringToPath(bounds: Bounds, height: number, ring: number[][]): string {
  return `${ring
    .map((point, index) => {
      const [x, y] = projectWith(
        bounds,
        height,
        point[0] as number,
        point[1] as number,
      );
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join("")}Z`;
}

function featureToPath(
  bounds: Bounds,
  height: number,
  feature: GeoFeature,
): string {
  const { type, coordinates } = feature.geometry;
  if (type === "Polygon") {
    return (coordinates as number[][][])
      .map((ring) => ringToPath(bounds, height, ring))
      .join("");
  }
  if (type === "MultiPolygon") {
    return (coordinates as number[][][][])
      .flatMap((polygon) =>
        polygon.map((ring) => ringToPath(bounds, height, ring)),
      )
      .join("");
  }
  return "";
}

const pathCache = new Map<
  string,
  {
    departments: Array<{ name: string; d: string }>;
    provinces: Array<{ name: string; d: string }>;
  }
>();

function pathsFor(bounds: Bounds, height: number, country: MapCountry) {
  const key = `${country}:${bounds.minLon},${bounds.maxLon},${bounds.minLat},${bounds.maxLat}`;
  const cached = pathCache.get(key);
  if (cached) return cached;
  const countryFeatures =
    country === "colombia"
      ? [getCountry("170")].filter(
          (feature): feature is GeoFeature => feature !== null,
        )
      : departamentos.features;
  const built = {
    departments: countryFeatures.map((feature) => ({
      name: feature.properties.name,
      d: featureToPath(bounds, height, feature),
    })),
    provinces: provincias.features.map((feature) => ({
      name: feature.properties.name,
      d: featureToPath(bounds, height, feature),
    })),
  };
  if (pathCache.size > 12) pathCache.clear();
  pathCache.set(key, built);
  return built;
}

function boundsForMarkers(markers: MapMarker[], country: MapCountry): Bounds {
  const baseBounds = BASE_BOUNDS[country];
  const bounds = { ...baseBounds };
  for (const marker of markers) {
    bounds.minLon = Math.min(
      bounds.minLon,
      Math.max(
        marker.longitude - MARKER_PADDING_DEG,
        baseBounds.minLon - MAX_EXTENSION_DEG,
      ),
    );
    bounds.maxLon = Math.max(
      bounds.maxLon,
      Math.min(
        marker.longitude + MARKER_PADDING_DEG,
        baseBounds.maxLon + MAX_EXTENSION_DEG,
      ),
    );
    bounds.minLat = Math.min(
      bounds.minLat,
      Math.max(
        marker.latitude - MARKER_PADDING_DEG,
        baseBounds.minLat - MAX_EXTENSION_DEG,
      ),
    );
    bounds.maxLat = Math.max(
      bounds.maxLat,
      Math.min(
        marker.latitude + MARKER_PADDING_DEG,
        baseBounds.maxLat + MAX_EXTENSION_DEG,
      ),
    );
  }
  const snap = (value: number) => Math.round(value * 2) / 2;
  return {
    minLon: snap(bounds.minLon),
    maxLon: snap(bounds.maxLon),
    minLat: snap(bounds.minLat),
    maxLat: snap(bounds.maxLat),
  };
}

function clampToBounds(
  bounds: Bounds,
  lon: number,
  lat: number,
): [number, number] {
  return [
    Math.min(bounds.maxLon, Math.max(bounds.minLon, lon)),
    Math.min(bounds.maxLat, Math.max(bounds.minLat, lat)),
  ];
}

export interface MapMarker {
  longitude: number;
  latitude: number;
  label: string;
  kind: "epicenter" | "station-acc" | "station-sis" | "volcano";
  href?: string;
  magnitude?: number;
  level?: string;
}

function EpicenterRings({
  x,
  y,
  magnitude,
  label,
}: {
  x: number;
  y: number;
  magnitude?: number;
  label: string;
}) {
  const base = 4 + Math.max(0, (magnitude ?? 4) - 3) * 2.4;
  return (
    <g>
      <title>{label}</title>
      <circle
        cx={x}
        cy={y}
        r={base * 2.2}
        fill="none"
        stroke="var(--color-map-ink)"
        strokeWidth="1"
        opacity="0.25"
        className="map-pulse"
      />
      <circle
        cx={x}
        cy={y}
        r={base * 1.4}
        fill="none"
        stroke="var(--color-map-ink)"
        strokeWidth="1"
        opacity="0.45"
      />
      <circle
        cx={x}
        cy={y}
        r={base * 0.7}
        fill="none"
        stroke="var(--color-map-ink)"
        strokeWidth="1.25"
        opacity="0.8"
      />
      <circle cx={x} cy={y} r="3" fill="var(--color-map-ink)" />
    </g>
  );
}

function StationDot({
  x,
  y,
  kind,
  label,
}: {
  x: number;
  y: number;
  kind: "station-acc" | "station-sis";
  label: string;
}) {
  return (
    <g>
      <title>{label}</title>
      {kind === "station-acc" ? (
        <>
          <circle
            cx={x}
            cy={y}
            r="5"
            fill="var(--color-map-paper)"
            stroke="var(--color-map-ink)"
            strokeWidth="1.5"
          />
          <circle cx={x} cy={y} r="1.8" fill="var(--color-map-ink)" />
        </>
      ) : (
        <circle
          cx={x}
          cy={y}
          r="3.2"
          fill="var(--color-map-paper)"
          stroke="var(--color-gray-600)"
          strokeWidth="1.25"
        />
      )}
    </g>
  );
}

function VolcanoTriangle({
  x,
  y,
  label,
  level,
}: {
  x: number;
  y: number;
  label: string;
  level?: string;
}) {
  const LEVEL_FILLS: Record<string, string> = {
    verde: "var(--color-glyph-verde)",
    amarillo: "var(--color-glyph-amarillo)",
    naranja: "var(--color-glyph-naranja)",
    rojo: "var(--color-glyph-rojo)",
  };
  const fill =
    LEVEL_FILLS[(level ?? "").trim().toLowerCase()] ??
    "var(--color-map-border)";
  const w = 7.5;
  const h = 6;
  const crater = 2.4;
  const path = `M${x - w},${y + h}L${x - crater},${y - h}L${x},${y - h + 2.2}L${x + crater},${y - h}L${x + w},${y + h}Z`;
  return (
    <g>
      <title>{label}</title>
      <path
        d={path}
        fill={fill}
        fillOpacity="0.9"
        stroke="var(--color-map-paper)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d={path}
        fill="none"
        stroke="var(--color-map-ink)"
        strokeWidth="0.75"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </g>
  );
}

export function PeruMap({
  markers,
  title,
  descriptionId,
  showProvinces = false,
  className,
  country = "peru",
}: {
  markers: MapMarker[];
  title: string;
  descriptionId?: string;
  showProvinces?: boolean;
  className?: string;
  country?: MapCountry;
}) {
  const bounds = boundsForMarkers(markers, country);
  const height = heightFor(bounds);
  const paths = pathsFor(bounds, height, country);
  const canShowProvinces = showProvinces && country === "peru";

  return (
    <figure data-testid={`${country}-map`} className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={title}
        aria-describedby={descriptionId}
        className="h-auto max-h-full w-full"
      >
        {canShowProvinces
          ? paths.provinces.map((province) => (
              <path
                key={province.name}
                d={province.d}
                fill="var(--color-map-land)"
                stroke="var(--color-map-subborder)"
                strokeWidth="0.5"
              >
                <title>{province.name}</title>
              </path>
            ))
          : null}
        {paths.departments.map((department) => (
          <path
            key={department.name}
            d={department.d}
            fill={canShowProvinces ? "none" : "var(--color-map-land)"}
            stroke="var(--color-map-border)"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            <title>{department.name}</title>
          </path>
        ))}
        {markers.map((marker) => {
          const [clampedLon, clampedLat] = clampToBounds(
            bounds,
            marker.longitude,
            marker.latitude,
          );
          const [x, y] = projectWith(bounds, height, clampedLon, clampedLat);
          let shape: React.ReactNode;
          if (marker.kind === "epicenter") {
            shape = (
              <EpicenterRings
                key="s"
                x={x}
                y={y}
                magnitude={marker.magnitude}
                label={marker.label}
              />
            );
          } else if (marker.kind === "volcano") {
            shape = (
              <VolcanoTriangle
                key="s"
                x={x}
                y={y}
                label={marker.label}
                level={marker.level}
              />
            );
          } else {
            shape = (
              <StationDot
                key="s"
                x={x}
                y={y}
                kind={marker.kind}
                label={marker.label}
              />
            );
          }
          return marker.href ? (
            <a key={marker.label} href={marker.href}>
              {shape}
            </a>
          ) : (
            <g key={marker.label}>{shape}</g>
          );
        })}
      </svg>
      <figcaption className="mt-1 font-mono text-[10px] text-gray-900">
        {country === "peru"
          ? "Límites INEI simplificados"
          : "Contorno Natural Earth simplificado"}{" "}
        · coordenadas oficiales de la fuente
      </figcaption>
    </figure>
  );
}
