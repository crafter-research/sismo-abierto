import departamentos from "../lib/geo/peru-departamentos.json";
import provincias from "../lib/geo/peru-provincias.json";

interface GeoFeature {
  properties: { name: string };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoCollection {
  features: GeoFeature[];
}

const BOUNDS = { minLon: -81.6, maxLon: -68.4, minLat: -18.6, maxLat: 0.3 };
const LON_SCALE = Math.cos(
  (((BOUNDS.minLat + BOUNDS.maxLat) / 2) * Math.PI) / 180,
);
const WIDTH = 640;
const HEIGHT = Math.round(
  (WIDTH * (BOUNDS.maxLat - BOUNDS.minLat)) /
    ((BOUNDS.maxLon - BOUNDS.minLon) * LON_SCALE),
);

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * WIDTH;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * HEIGHT;
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

function ringToPath(ring: number[][]): string {
  return `${ring
    .map((point, index) => {
      const [x, y] = project(point[0] as number, point[1] as number);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join("")}Z`;
}

function featureToPath(feature: GeoFeature): string {
  const { type, coordinates } = feature.geometry;
  if (type === "Polygon") {
    return (coordinates as number[][][]).map(ringToPath).join("");
  }
  if (type === "MultiPolygon") {
    return (coordinates as number[][][][])
      .flatMap((polygon) => polygon.map(ringToPath))
      .join("");
  }
  return "";
}

const DEPARTMENT_PATHS = (departamentos as GeoCollection).features.map(
  (feature) => ({
    name: feature.properties.name,
    d: featureToPath(feature),
  }),
);

const PROVINCE_PATHS = (provincias as GeoCollection).features.map(
  (feature) => ({
    name: feature.properties.name,
    d: featureToPath(feature),
  }),
);

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
    verde: "#28a948",
    amarillo: "#ffc543",
    naranja: "#ff9300",
    rojo: "#ea001d",
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
}: {
  markers: MapMarker[];
  title: string;
  descriptionId?: string;
  showProvinces?: boolean;
  className?: string;
}) {
  return (
    <figure data-testid="peru-map" className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={title}
        aria-describedby={descriptionId}
        className="h-auto max-h-full w-full"
      >
        {showProvinces
          ? PROVINCE_PATHS.map((province) => (
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
        {DEPARTMENT_PATHS.map((department) => (
          <path
            key={department.name}
            d={department.d}
            fill={showProvinces ? "none" : "var(--color-map-land)"}
            stroke="var(--color-map-border)"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            <title>{department.name}</title>
          </path>
        ))}
        {markers.map((marker) => {
          const [x, y] = project(marker.longitude, marker.latitude);
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
      <figcaption className="mt-1 font-mono text-[10px] text-gray-600">
        Límites INEI simplificados · coordenadas oficiales de la fuente
      </figcaption>
    </figure>
  );
}
