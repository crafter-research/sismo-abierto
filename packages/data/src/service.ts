import type { EventProviderId, EventQueryFilters } from "@sismo/contracts";
import { fetchVolcanoes } from "./adapters/volcanoes.ts";
import {
  getEvent,
  getLatestEvent,
  listEventStations,
  queryEventCatalog,
} from "./events.ts";

export const LIMITATIONS = {
  latest:
    "La fuente publica un único evento vigente y no expone su hora exacta de actualización.",
  unstableAceldat:
    "Los endpoints de ACELDAT no están documentados oficialmente y pueden cambiar sin aviso.",
  censisRange:
    "El catálogo se consulta en origen (XLSX de CENSIS) por rango de fechas; no se redistribuye el dataset.",
  aceldatCoverage:
    "ACELDAT publica reportes acelerométricos usualmente para sismos de magnitud 4.5 o superior.",
  reduction:
    "Las series se reducen solo para visualización; PGA y métricas se calculan sobre la serie completa.",
  volcanoFreshness:
    "La capa volcánica no publica fecha de actualización por registro; el nivel mostrado es el publicado por la fuente, no una alerta vigente.",
  notOfficial:
    "Proyecto comunitario, no oficial. No es un sistema de alerta ni de predicción.",
  sgcRevisions:
    "Los eventos del SGC pueden cambiar al pasar de procesamiento automático a revisión manual.",
  sgcLicense:
    "Provider experimental: su publicación permanece deshabilitada en producción hasta confirmar por escrito los términos de reutilización con el SGC.",
} as const;

export async function buildLatestEventResponse(
  provider: EventProviderId = "igp",
) {
  const event = await getLatestEvent(provider);
  return {
    event,
    limitations:
      provider === "sgc"
        ? [
            LIMITATIONS.sgcRevisions,
            LIMITATIONS.sgcLicense,
            LIMITATIONS.notOfficial,
          ]
        : [LIMITATIONS.latest, LIMITATIONS.notOfficial],
  };
}

export async function buildEventListResponse(filters: EventQueryFilters) {
  const { events, provenance } = await queryEventCatalog(filters);
  const provider = filters.provider ?? "igp";
  return {
    events,
    filters: {
      provider,
      since: filters.since ?? null,
      until: filters.until ?? null,
      minMagnitude: filters.minMagnitude ?? null,
      maxMagnitude: filters.maxMagnitude ?? null,
    },
    provenance,
    limitations:
      provider === "sgc"
        ? [
            LIMITATIONS.sgcRevisions,
            LIMITATIONS.sgcLicense,
            LIMITATIONS.notOfficial,
          ]
        : [LIMITATIONS.censisRange, LIMITATIONS.notOfficial],
  };
}

export async function buildEventDetailResponse(eventId: string) {
  const event = await getEvent(eventId);
  return {
    event,
    limitations: eventId.startsWith("sgc-")
      ? [
          LIMITATIONS.sgcRevisions,
          LIMITATIONS.sgcLicense,
          LIMITATIONS.notOfficial,
        ]
      : [LIMITATIONS.notOfficial],
  };
}

export async function buildStationListResponse(eventId: string) {
  const { stations, provenance } = await listEventStations(eventId);
  return {
    eventId,
    stations,
    provenance,
    limitations: [LIMITATIONS.unstableAceldat, LIMITATIONS.aceldatCoverage],
  };
}

export async function buildVolcanoListResponse() {
  const { volcanoes, provenance } = await fetchVolcanoes();
  return {
    volcanoes,
    freshness: "FRESHNESS_UNKNOWN" as const,
    provenance,
    limitations: [LIMITATIONS.volcanoFreshness, LIMITATIONS.notOfficial],
  };
}

export async function buildVolcanoDetailResponse(slug: string) {
  const { volcanoes } = await fetchVolcanoes();
  const volcano = volcanoes.find((record) => record.slug === slug);
  if (!volcano) return null;
  return {
    volcano,
    freshness: "FRESHNESS_UNKNOWN" as const,
    limitations: [LIMITATIONS.volcanoFreshness, LIMITATIONS.notOfficial],
  };
}
