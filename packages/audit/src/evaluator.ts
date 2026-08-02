import type {
  CandidateEvent,
  EvidenceEntry,
  FrozenPrediction,
  PredictionAudit,
  PredictionVerdict,
} from "@sismo/contracts";
import { fetchUsgsEvents, queryEventCatalog } from "@sismo/data";
import { calculateBackgroundRate } from "./baseline.ts";
import {
  matchersForTarget,
  matchRegion,
  type RegionMatcher,
} from "./geography.ts";
import { interpretPredictionResult } from "./interpretation.ts";
import {
  isMagnitudeInRange,
  windowEndUtcMs,
  windowHasClosed,
  windowStartUtcMs,
} from "./windows.ts";

const PAIRING_TOLERANCE_MS = 90_000;

export interface RawCandidate extends CandidateEvent {
  match: "inside" | "boundary";
  sourceDisagreement: boolean;
  disagreementDetail: string | null;
}

export function classifyVerdict(options: {
  windowClosed: boolean;
  candidates: RawCandidate[];
  allTargetsVague: boolean;
  hasVagueTargets?: boolean;
}): PredictionVerdict {
  if (!options.windowClosed) return "PENDING";
  const strict = options.candidates.filter(
    (candidate) =>
      candidate.match === "inside" && !candidate.sourceDisagreement,
  );
  if (strict.length > 0) return "STRICT_HIT";
  const disagreement = options.candidates.filter(
    (candidate) => candidate.match === "inside" && candidate.sourceDisagreement,
  );
  if (disagreement.length > 0) return "SOURCE_DISAGREEMENT";
  const boundary = options.candidates.filter(
    (candidate) => candidate.match === "boundary",
  );
  if (boundary.length > 0 || options.allTargetsVague || options.hasVagueTargets)
    return "AMBIGUOUS_GEOGRAPHY";
  return "NO_MATCH";
}

interface SimpleEvent {
  timeUtcIso: string;
  magnitude: number;
  latitude: number;
  longitude: number;
  place: string;
}

async function findCandidatesForMatcher(
  prediction: FrozenPrediction,
  matcher: RegionMatcher,
  evidence: EvidenceEntry[],
  nowIso: string,
): Promise<RawCandidate[]> {
  const bbox = matcher.bbox;
  if (!bbox) return [];
  const startDate = new Date(windowStartUtcMs(prediction))
    .toISOString()
    .slice(0, 10);
  const endDate = new Date(windowEndUtcMs(prediction) + 86_400_000)
    .toISOString()
    .slice(0, 10);

  const usgs = await fetchUsgsEvents({
    startTime: startDate,
    endTime: endDate,
    minMagnitude: Math.max(prediction.predictedMagnitudeMin - 0.5, 0),
    minLatitude: bbox.minLat,
    maxLatitude: bbox.maxLat,
    minLongitude: bbox.minLon,
    maxLongitude: bbox.maxLon,
  });
  evidence.push({
    at: nowIso,
    action: `Consulta USGS para ${matcher.label}`,
    url: usgs.queryUrl,
    detail: `${usgs.events.length} eventos devueltos (magnitud mínima ampliada -0.5 para detectar desacuerdos)`,
  });

  const isPeru = matcher.kind === "peru-department";
  let censisEvents: SimpleEvent[] = [];
  if (isPeru) {
    const catalog = await queryEventCatalog({
      since: startDate,
      until: endDate,
      minMagnitude: Math.max(prediction.predictedMagnitudeMin - 0.5, 1),
    });
    evidence.push({
      at: nowIso,
      action: `Consulta CENSIS para ${matcher.label}`,
      url: catalog.queryUrl,
      detail: `${catalog.events.length} eventos devueltos en el rango`,
    });
    censisEvents = catalog.events
      .filter((event) => event.timeUtc !== null)
      .map((event) => ({
        timeUtcIso: event.timeUtc as string,
        magnitude: event.magnitude,
        latitude: event.latitude,
        longitude: event.longitude,
        place: event.reference ?? "CENSIS",
      }));
  }

  const usgsEvents: SimpleEvent[] = usgs.events.map((event) => ({
    timeUtcIso: event.timeUtcIso,
    magnitude: event.magnitude,
    latitude: event.latitude,
    longitude: event.longitude,
    place: event.place,
  }));

  const candidates: RawCandidate[] = [];
  const consumedUsgs = new Set<number>();

  const primary: Array<{ event: SimpleEvent; sourceId: string }> = isPeru
    ? censisEvents.map((event) => ({ event, sourceId: "igp-censis-catalogo" }))
    : usgsEvents.map((event) => ({ event, sourceId: "usgs-fdsn" }));

  for (const { event, sourceId } of primary) {
    const originMs = Date.parse(event.timeUtcIso);
    const inWindow =
      originMs >= windowStartUtcMs(prediction) &&
      originMs <= windowEndUtcMs(prediction);
    if (!inWindow) continue;

    const geoMatch = matchRegion(matcher, event.latitude, event.longitude);
    if (geoMatch === "outside" || geoMatch === "vague") continue;

    let magnitudeQualifies = isMagnitudeInRange(prediction, event.magnitude);
    let sourceDisagreement = false;
    let disagreementDetail: string | null = null;
    let effectiveSource = sourceId;

    if (isPeru) {
      const pairIndex = usgsEvents.findIndex(
        (candidate, index) =>
          !consumedUsgs.has(index) &&
          Math.abs(Date.parse(candidate.timeUtcIso) - originMs) <=
            PAIRING_TOLERANCE_MS,
      );
      if (pairIndex >= 0) {
        consumedUsgs.add(pairIndex);
        const pair = usgsEvents[pairIndex] as SimpleEvent;
        effectiveSource = "igp-censis-catalogo+usgs-fdsn";
        const pairQualifies = isMagnitudeInRange(prediction, pair.magnitude);
        if (magnitudeQualifies !== pairQualifies) {
          sourceDisagreement = true;
          disagreementDetail = `CENSIS M${event.magnitude} y USGS M${pair.magnitude} no coinciden respecto del rango publicado [${prediction.predictedMagnitudeMin}, ${prediction.predictedMagnitudeMax}]`;
          magnitudeQualifies = true;
        }
      }
    }

    if (!magnitudeQualifies) continue;

    candidates.push({
      sourceId: effectiveSource,
      eventTimeUtc: event.timeUtcIso,
      magnitude: event.magnitude,
      latitude: event.latitude,
      longitude: event.longitude,
      place: event.place,
      matchedRegion: matcher.label,
      regionIsAmbiguous: geoMatch === "boundary",
      match: geoMatch,
      sourceDisagreement,
      disagreementDetail,
    });
  }

  return candidates;
}

export async function evaluatePrediction(
  prediction: FrozenPrediction,
  nowUtcMs: number,
): Promise<PredictionAudit> {
  const nowIso = new Date(nowUtcMs).toISOString();
  const matchers = prediction.targetRegions.flatMap((target) =>
    matchersForTarget(target),
  );
  const unambiguous = matchers.filter((matcher) => matcher.bbox !== null);
  const ambiguousRegions = matchers
    .filter((matcher) => matcher.bbox === null)
    .map((matcher) => matcher.label);
  const windowClosed = windowHasClosed(prediction, nowUtcMs);
  const evidence: EvidenceEntry[] = [];
  let candidates: RawCandidate[] = [];

  if (windowClosed) {
    for (const matcher of unambiguous) {
      candidates = candidates.concat(
        await findCandidatesForMatcher(prediction, matcher, evidence, nowIso),
      );
    }
    candidates = Array.from(
      new Map(
        candidates.map((candidate) => [
          `${candidate.eventTimeUtc}:${candidate.magnitude}:${candidate.latitude}:${candidate.longitude}`,
          candidate,
        ]),
      ).values(),
    );
  } else {
    evidence.push({
      at: nowIso,
      action: "Ventana abierta",
      url: null,
      detail:
        "El protocolo congelado mantiene PENDING y no busca coincidencias hasta que la ventana termine.",
    });
  }

  let baseline = null;
  try {
    const result = await calculateBackgroundRate(prediction);
    if (result) {
      baseline = result.baseline;
      for (const query of result.queries) {
        evidence.push({
          at: nowIso,
          action: "Consulta de tasa base (365 días previos a la ventana)",
          url: query.url,
          detail: `${query.matchingEventCount} eventos históricos en esta geografía y rango; ${baseline.matchingEventCount} únicos en el conjunto de destinos`,
        });
      }
    }
  } catch {
    evidence.push({
      at: nowIso,
      action: "Tasa base no disponible",
      url: null,
      detail:
        "La consulta histórica a USGS falló; se reintentará en la próxima corrida.",
    });
  }

  const verdict = classifyVerdict({
    windowClosed,
    candidates,
    allTargetsVague: unambiguous.length === 0,
    hasVagueTargets: ambiguousRegions.length > 0,
  });

  return {
    predictionId: prediction.predictionId,
    verdict,
    interpretation: interpretPredictionResult(verdict, baseline),
    evaluatedAt: windowClosed ? nowIso : null,
    windowStartLima: `${prediction.startDate}T00:00:00-05:00`,
    windowEndLima: prediction.deadlineEndLima,
    candidates,
    ambiguousRegions,
    unambiguousRegions: unambiguous.map((matcher) => matcher.label),
    baseline,
    evidence,
  };
}
