"use client";

import {
  type DistanceFromEvent,
  distanceFromEvent,
  mmiLabel,
  mmiRoman,
} from "@sismo/data/intensity";
import { LoaderIcon, MapPinIcon, XIcon } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { type MapProjection, projectWith } from "../lib/map-projection";

interface EventPoint {
  latitude: number;
  longitude: number;
  depthKm: number;
  magnitude: number;
  timeUtc: string | null;
}

type Status =
  | "hidden"
  | "idle"
  | "locating"
  | "ready"
  | "outside"
  | "denied"
  | "error";

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracyM: number;
}

interface State {
  status: Status;
  location: UserLocation | null;
  distance: DistanceFromEvent | null;
  event: EventPoint;
  locate: () => void;
  clear: () => void;
}

const PERU = { minLat: -18.6, maxLat: 0.3, minLon: -81.6, maxLon: -68.4 };

const Context = createContext<State | null>(null);

function insidePeru(lat: number, lon: number) {
  return (
    lat >= PERU.minLat &&
    lat <= PERU.maxLat &&
    lon >= PERU.minLon &&
    lon <= PERU.maxLon
  );
}

export function UserDistanceProvider({
  event,
  children,
}: {
  event: EventPoint;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<Status>("hidden");
  const [location, setLocation] = useState<UserLocation | null>(null);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyM: position.coords.accuracy,
        };
        setLocation(next);
        setStatus(
          insidePeru(next.latitude, next.longitude) ? "ready" : "outside",
        );
      },
      (error) =>
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true },
    );
  }, []);

  const clear = useCallback(() => {
    setLocation(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const forced = new URLSearchParams(window.location.search).has("ubicacion");
    async function start() {
      let eligible = forced;
      if (!eligible) {
        try {
          const response = await fetch("/api/internal/visitor-country", {
            cache: "no-store",
          });
          const { country } = (await response.json()) as {
            country: string | null;
          };
          eligible =
            country === "PE" ||
            (country === null && process.env.NODE_ENV !== "production");
        } catch {
          eligible = false;
        }
      }
      if (cancelled || !eligible) return;
      setStatus("idle");
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        if (!cancelled && permission.state === "granted") locate();
      } catch {
        // Sin Permissions API: queda el botón.
      }
    }
    start();
    return () => {
      cancelled = true;
    };
  }, [locate]);

  const distance =
    location && status === "ready"
      ? distanceFromEvent(event, location.latitude, location.longitude)
      : null;

  return (
    <Context.Provider
      value={{ status, location, distance, event, locate, clear }}
    >
      {children}
    </Context.Provider>
  );
}

function useUserDistance() {
  return useContext(Context);
}

function formatKm(km: number) {
  return km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString("es-PE");
}

function arrivalTime(timeUtc: string | null, seconds: number) {
  if (!timeUtc) return null;
  const at = new Date(new Date(timeUtc).getTime() + seconds * 1000);
  return at.toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
}

export function UserDistancePanel() {
  const state = useUserDistance();
  if (!state || state.status === "hidden") return null;
  const { status, distance, location, event, locate, clear } = state;

  if (status === "ready" && distance && location) {
    const arrival = arrivalTime(event.timeUtc, distance.sWaveSeconds);
    return (
      <div
        className="mt-5 max-w-md rounded-md border border-gray-400 bg-background-100 p-4"
        data-testid="user-distance"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] text-gray-800 uppercase tracking-widest">
              Distancia desde tu ubicación
            </p>
            <p className="mt-1 font-semibold text-[32px] text-gray-1000 leading-none tracking-tight">
              {formatKm(distance.epicentralKm)} km
            </p>
            <p className="mt-1 text-[13px] text-gray-900">
              en línea recta al epicentro · {formatKm(distance.hypocentralKm)}{" "}
              km al foco, a {event.depthKm} km de profundidad
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label="Ocultar distancia"
            className="rounded-md p-1 text-gray-800 hover:bg-background-200 hover:text-gray-1000"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 border-gray-200 border-t pt-3 font-mono text-[13px] text-gray-900">
          <div>
            <dt className="text-[11px] text-gray-800 uppercase">
              Intensidad estimada
            </dt>
            <dd>
              {mmiRoman(distance.estimatedMmi)} ·{" "}
              {mmiLabel(distance.estimatedMmi)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-gray-800 uppercase">
              Llegada de la onda S
            </dt>
            <dd>
              ~{Math.round(distance.sWaveSeconds)} s
              {arrival ? ` · ${arrival}` : ""}
            </dd>
          </div>
        </dl>
        <p className="mt-3 font-mono text-[10px] text-gray-700">
          Precisión de tu ubicación ±{Math.round(location.accuracyM)} m. Tu
          ubicación no sale de tu navegador. Intensidad y llegada son
          estimaciones, no mediciones.
        </p>
      </div>
    );
  }

  const messages: Partial<Record<Status, string>> = {
    outside: "Tu ubicación está fuera de Perú.",
    denied: "Sin permiso de ubicación. Puedes activarlo en tu navegador.",
    error: "No pudimos obtener tu ubicación.",
  };

  return (
    <div className="mt-5 flex max-w-md flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={locate}
        disabled={status === "locating"}
        data-testid="user-distance-button"
        className="flex h-9 items-center gap-2 rounded-md border border-gray-400 bg-background-100 px-3 font-medium text-[13px] text-gray-1000 hover:border-gray-500 hover:bg-background-200 disabled:opacity-60"
      >
        {status === "locating" ? (
          <LoaderIcon className="size-4 animate-spin" />
        ) : (
          <MapPinIcon className="size-4" />
        )}
        {status === "locating"
          ? "Buscando tu ubicación…"
          : "¿Qué tan lejos fue de ti?"}
      </button>
      <span className="font-mono text-[10px] text-gray-700">
        {messages[status] ?? "Tu ubicación no sale de tu navegador."}
      </span>
    </div>
  );
}

export function UserDistanceLayer({
  projection,
  event,
}: {
  projection: MapProjection;
  event: { latitude: number; longitude: number };
}) {
  const state = useUserDistance();
  if (state?.status !== "ready" || !state.location || !state.distance)
    return null;
  const { bounds, height } = projection;
  const [ex, ey] = projectWith(bounds, height, event.longitude, event.latitude);
  const [ux, uy] = projectWith(
    bounds,
    height,
    Math.min(bounds.maxLon, Math.max(bounds.minLon, state.location.longitude)),
    Math.min(bounds.maxLat, Math.max(bounds.minLat, state.location.latitude)),
  );
  const mx = (ex + ux) / 2;
  const my = (ey + uy) / 2;
  return (
    <g data-testid="user-distance-line" pointerEvents="none">
      <line
        x1={ux}
        y1={uy}
        x2={ex}
        y2={ey}
        stroke="var(--color-map-paper)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1={ux}
        y1={uy}
        x2={ex}
        y2={ey}
        stroke="var(--color-map-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx={ux}
        cy={uy}
        r="6"
        fill="var(--color-map-paper)"
        stroke="var(--color-map-ink)"
        strokeWidth="2"
      />
      <circle cx={ux} cy={uy} r="2.2" fill="var(--color-map-ink)" />
      <text
        x={mx}
        y={my - 8}
        textAnchor="middle"
        className="font-mono"
        fontSize="12"
        fontWeight="600"
        fill="var(--color-map-ink)"
        stroke="var(--color-map-paper)"
        strokeWidth="3.5"
        paintOrder="stroke"
      >
        {formatKm(state.distance.epicentralKm)} km
      </text>
    </g>
  );
}
