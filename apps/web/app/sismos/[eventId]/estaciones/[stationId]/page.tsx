import { zoneAt } from "@sismo/terrain";
import Link from "next/link";
import { ClassBadge, SourceBadge } from "../../../../../components/badges";
import { SourceErrorState } from "../../../../../components/error-state";
import { TerrainZoneCard } from "../../../../../components/terrain-zone";
import { WaveformViewer } from "../../../../../components/waveform-viewer";
import { getWaveformView } from "../../../../../lib/waveform";

export const dynamic = "force-dynamic";

export default async function StationWaveformPage({
  params,
}: {
  params: Promise<{ eventId: string; stationId: string }>;
}) {
  const { eventId, stationId } = await params;

  let waveform: Awaited<ReturnType<typeof getWaveformView>> | null = null;
  let loadError: unknown = null;
  try {
    waveform = await getWaveformView(eventId, stationId);
  } catch (error) {
    loadError = error;
  }

  if (!waveform) {
    return (
      <div className="space-y-4">
        <nav className="text-xs text-gray-800">
          <Link href="/" className="hover:underline">
            Sismos
          </Link>{" "}
          /{" "}
          <Link href={`/sismos/${eventId}`} className="hover:underline">
            <span className="font-mono">{eventId}</span>
          </Link>{" "}
          / <span className="font-mono">{stationId}</span>
        </nav>
        <SourceErrorState
          error={loadError}
          context={`No pudimos cargar las ondas de la estación ${stationId}.`}
        />
      </div>
    );
  }

  const { header } = waveform;
  const terrainZone = zoneAt(header.stationLongitude, header.stationLatitude);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-800">
        <Link href="/" className="hover:underline">
          Sismos
        </Link>{" "}
        /{" "}
        <Link href={`/sismos/${eventId}`} className="hover:underline">
          <span className="font-mono">{eventId}</span>
        </Link>{" "}
        / <span className="font-mono">{stationId}</span>
      </nav>

      <header
        className="rounded-lg border border-gray-200 p-4"
        data-testid="station-summary"
      >
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold">
            Estación{" "}
            <span className="font-mono text-official">
              {header.stationCode}
            </span>
          </h1>
          <span className="text-gray-800">{header.stationName}</span>
          <ClassBadge value="official" />
        </div>
        <dl className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-2">
            <dt className="text-gray-800">Muestreo:</dt>
            <dd className="font-mono">{header.sampleRateHz} muestras/s</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-800">Muestras:</dt>
            <dd className="font-mono">{header.sampleCount}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-800">Unidades:</dt>
            <dd className="font-mono">{header.units}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-800">Inicio del registro:</dt>
            <dd className="font-mono">{header.startTimeUtc}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-800">Distancia epicentral:</dt>
            <dd className="font-mono">{header.epicentralDistanceKm} km</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-800">Corrección de línea base:</dt>
            <dd>{header.baselineCorrected ? "Sí" : "No"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-sm">
          PGA oficial (Z, N, E):{" "}
          <span className="font-mono">
            {header.pga.z.toFixed(4)}, {header.pga.n.toFixed(4)},{" "}
            {header.pga.e.toFixed(4)} {header.units}
          </span>{" "}
          <ClassBadge value="official" />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <a
            href={waveform.sourceFileUrl}
            className="text-sm font-medium text-official underline"
            rel="noreferrer"
            data-testid="raw-source-link"
          >
            Archivo original en el IGP →
          </a>
        </div>
        <div className="mt-3">
          <SourceBadge provenance={waveform.provenance} />
        </div>
      </header>

      <TerrainZoneCard zone={terrainZone} cityFallback={header.stationName} />

      <section aria-labelledby="ondas-titulo">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h2 id="ondas-titulo" className="font-semibold">
            Componentes Z, N y E
          </h2>
          <ClassBadge value="derived" />
          <span className="text-xs text-gray-800">
            Reducción visual 1:{waveform.reductionFactor}. Las métricas se
            calculan sobre la serie completa.
          </span>
        </div>
        <WaveformViewer waveform={waveform} />
      </section>
    </div>
  );
}
