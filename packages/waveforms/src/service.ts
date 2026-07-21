import type { WaveformView } from "@sismo/contracts";
import { derivedProvenance } from "@sismo/contracts";
import {
  fetchAceldatEventDetail,
  fetchAceldatRawFile,
  fetchAceldatReports,
  parseCensisEventId,
  parseRanEventId,
  SourceError,
  waveformFileUrl,
} from "@sismo/data";
import { computePga, parseAceldatFile, reduceForView } from "@sismo/waveforms";

const VIEW_BUCKETS = 900;

export async function getWaveformView(
  eventId: string,
  stationId: string,
): Promise<WaveformView> {
  let reportNumber = parseRanEventId(eventId);
  if (reportNumber === null) {
    const parsed = parseCensisEventId(eventId);
    if (!parsed) {
      throw new SourceError({
        kind: "not_found",
        sourceId: "igp-aceldat",
        message: `ID de evento no reconocido: ${eventId}`,
      });
    }
    const { reports } = await fetchAceldatReports();
    const target = Date.parse(parsed.timeUtcIso);
    reportNumber =
      reports.find(
        (report) => Math.abs(Date.parse(report.timeUtcIso) - target) <= 90_000,
      )?.reportNumber ?? null;
    if (reportNumber === null) {
      throw new SourceError({
        kind: "not_found",
        sourceId: "igp-aceldat",
        message: "Este evento no tiene reporte acelerométrico en ACELDAT",
      });
    }
  }

  const { reports } = await fetchAceldatReports();
  const report = reports.find((entry) => entry.reportNumber === reportNumber);
  if (!report) {
    throw new SourceError({
      kind: "not_found",
      sourceId: "igp-aceldat",
      message: `No existe el reporte ACELDAT ${reportNumber}`,
    });
  }
  const detail = await fetchAceldatEventDetail(report.timeUtcIso);
  const fileUrl = waveformFileUrl(detail, stationId);
  if (!fileUrl) {
    throw new SourceError({
      kind: "not_found",
      sourceId: "igp-aceldat",
      message: `La estación ${stationId} no tiene archivo acelerométrico en este reporte`,
    });
  }

  const rawText = await fetchAceldatRawFile(fileUrl);
  const parsed = parseAceldatFile(rawText);
  const computedPga = computePga(parsed.components);
  const sampleCount = parsed.components.z.length;
  const reduced = {
    z: reduceForView(parsed.components.z, VIEW_BUCKETS),
    n: reduceForView(parsed.components.n, VIEW_BUCKETS),
    e: reduceForView(parsed.components.e, VIEW_BUCKETS),
  };

  return {
    eventId,
    stationId,
    header: parsed.header,
    computedPga,
    computedOverFullSeries: true,
    reducedComponents: reduced,
    reductionFactor:
      Math.round((sampleCount / (reduced.z.length || 1)) * 100) / 100,
    sourceFileUrl: fileUrl,
    provenance: derivedProvenance(
      detail.provenance,
      "Series reducidas solo para visualización; PGA y métricas calculadas sobre la serie completa del archivo oficial.",
    ),
  };
}

export async function buildWaveformResponse(
  eventId: string,
  stationId: string,
) {
  const waveform = await getWaveformView(eventId, stationId);
  return {
    waveform,
    limitations: [
      "Las series se reducen solo para visualización; PGA y métricas se calculan sobre la serie completa.",
      "Los endpoints de ACELDAT no están documentados oficialmente y pueden cambiar sin aviso.",
    ],
  };
}
