import type { ClaimedValidation, FrozenPrediction } from "@sismo/contracts";
import { matchersForTarget, matchRegion } from "./geography.ts";

const PERU_SOURCE_ID = "igp-censis-catalogo";

export interface DimensionScore {
  status: "within" | "outside" | "undetermined";
  detail: string;
}

export interface MagnitudeScore extends DimensionScore {
  error: number | null;
  sourceId: string | null;
  magnitude: number | null;
}

export interface ClaimAccuracy {
  predictionId: string;
  magnitude: MagnitudeScore;
  geography: DimensionScore;
  window: DimensionScore;
  publishedBeforeWindowClosed: boolean;
  daysBeforeWindowClose: number;
}

function isInPeru(latitude: number, longitude: number): boolean {
  return (
    latitude >= -18.4 &&
    latitude <= -0.03 &&
    longitude >= -81.4 &&
    longitude <= -68.6
  );
}

export function principalSource(
  claim: ClaimedValidation,
): ClaimedValidation["sources"][number] | null {
  const usable = claim.sources.filter((source) => source.magnitude > 0);
  if (usable.length === 0) return null;
  if (isInPeru(claim.latitude, claim.longitude)) {
    const peru = usable.find((source) => source.sourceId === PERU_SOURCE_ID);
    if (peru) return peru;
  }
  const usgs = usable.find((source) => source.sourceId === "usgs-fdsn");
  return usgs ?? usable[0] ?? null;
}

export function magnitudeError(
  magnitude: number,
  min: number,
  max: number,
): number {
  if (magnitude < min) return Number((min - magnitude).toFixed(2));
  if (magnitude > max) return Number((magnitude - max).toFixed(2));
  return 0;
}

export function scoreClaim(
  claim: ClaimedValidation,
  prediction: FrozenPrediction,
): ClaimAccuracy {
  const source = principalSource(claim);
  const magnitude: MagnitudeScore = source
    ? (() => {
        const error = magnitudeError(
          source.magnitude,
          prediction.predictedMagnitudeMin,
          prediction.predictedMagnitudeMax,
        );
        return {
          status: error === 0 ? ("within" as const) : ("outside" as const),
          error,
          sourceId: source.sourceId,
          magnitude: source.magnitude,
          detail:
            error === 0
              ? `M${source.magnitude.toFixed(1)} dentro de ${prediction.predictedMagnitudeMin.toFixed(1)}-${prediction.predictedMagnitudeMax.toFixed(1)}`
              : `M${source.magnitude.toFixed(1)} a ${error.toFixed(2)} del rango ${prediction.predictedMagnitudeMin.toFixed(1)}-${prediction.predictedMagnitudeMax.toFixed(1)}`,
        };
      })()
    : {
        status: "undetermined" as const,
        error: null,
        sourceId: null,
        magnitude: null,
        detail: "Sin registro en fuentes oficiales",
      };

  let geography: DimensionScore = {
    status: "outside",
    detail: "Fuera de todo destino publicado",
  };
  let sawVague = false;
  for (const target of prediction.targetRegions) {
    for (const matcher of matchersForTarget(target)) {
      const result = matchRegion(matcher, claim.latitude, claim.longitude);
      if (result === "inside") {
        geography = { status: "within", detail: `Dentro de ${matcher.label}` };
        break;
      }
      if (result === "boundary") {
        geography = {
          status: "outside",
          detail: `A menos de 25 km del límite de ${matcher.label}, tratado como frontera`,
        };
      }
      if (result === "vague") sawVague = true;
    }
    if (geography.status === "within") break;
  }
  if (geography.status !== "within" && sawVague) {
    geography = {
      status: "undetermined",
      detail:
        "El destino publicado no tiene límites definidos, así que el protocolo no le inventa una frontera ni resuelve la distancia",
    };
  }

  const eventTime = Date.parse(claim.eventTimeUtc);
  const windowStart = Date.parse(`${prediction.startDate}T00:00:00-05:00`);
  const windowEnd = Date.parse(prediction.deadlineEndLima);
  const inWindow = eventTime >= windowStart && eventTime <= windowEnd;
  const offMs = inWindow
    ? 0
    : eventTime < windowStart
      ? windowStart - eventTime
      : eventTime - windowEnd;
  const offDays = Number((offMs / 86_400_000).toFixed(1));
  const window: DimensionScore = {
    status: inWindow ? "within" : "outside",
    detail: inWindow
      ? "Dentro del plazo publicado"
      : `A ${offDays.toFixed(1)} días del plazo publicado`,
  };

  const publishedAt = Date.parse(claim.sourcePublishedAtLima);
  const daysBefore = Number(
    ((windowEnd - publishedAt) / 86_400_000).toFixed(1),
  );

  return {
    predictionId: claim.predictionId,
    magnitude,
    geography,
    window,
    publishedBeforeWindowClosed: publishedAt < windowEnd,
    daysBeforeWindowClose: Math.max(0, daysBefore),
  };
}

export type OpenWindowState =
  | "NO_CLAIM_YET"
  | "CLAIM_INSIDE_RANGE"
  | "CLAIM_OUTSIDE_RANGE"
  | "CLAIM_SOURCES_SPLIT";

/**
 * Estado de una ventana que todavía no cierra.
 *
 * El protocolo congelado no busca coincidencias antes del deadline, y con razón:
 * cantar un acierto a mitad de la ventana es exactamente lo que se le critica a
 * la cuenta. Pero cuando ya publicó un reclamo, decir solo "Pendiente" oculta
 * que hay algo medible. Esto describe el reclamo sin adelantar el veredicto.
 */
export function openWindowState(
  claim: ClaimedValidation | null,
  prediction: FrozenPrediction,
): OpenWindowState {
  if (!claim) return "NO_CLAIM_YET";
  const usable = claim.sources.filter((source) => source.magnitude > 0);
  if (usable.length === 0) return "CLAIM_OUTSIDE_RANGE";
  const inside = usable.filter(
    (source) =>
      source.magnitude >= prediction.predictedMagnitudeMin &&
      source.magnitude <= prediction.predictedMagnitudeMax,
  );
  if (inside.length === usable.length) return "CLAIM_INSIDE_RANGE";
  if (inside.length === 0) return "CLAIM_OUTSIDE_RANGE";
  return "CLAIM_SOURCES_SPLIT";
}
