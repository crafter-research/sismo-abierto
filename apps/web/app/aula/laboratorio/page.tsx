import type { WaveformView } from "@sismo/contracts";
import {
  fetchAceldatReports,
  listEventStations,
  utcIsoToLimaIso,
} from "@sismo/data";
import { getWaveformView } from "@sismo/waveforms";
import Link from "next/link";
import { ClassBadge } from "../../../components/badges";
import { CopyLinkButton } from "../../../components/copy-link-button";
import { SourceErrorState } from "../../../components/error-state";
import { formatLimaDateTime } from "../../../lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Laboratorio sísmico" };

function maxPga(waveform: WaveformView): number {
  return Math.max(
    waveform.computedPga.z,
    waveform.computedPga.n,
    waveform.computedPga.e,
  );
}

function MiniWave({
  waveform,
  label,
}: {
  waveform: WaveformView;
  label: string;
}) {
  const series = waveform.reducedComponents.n;
  const peak = Math.max(...series.map((value) => Math.abs(value)), 1e-9);
  const width = 400;
  const height = 80;
  const stepX = width / (series.length - 1 || 1);
  const path = series
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"}${(index * stepX).toFixed(1)},${(
          height / 2 - (value / peak) * (height / 2 - 4)
        ).toFixed(1)}`,
    )
    .join("");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Componente N de ${label}, escala propia de la estación`}
      className="h-20 w-full rounded border border-gray-200 bg-background-100"
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--color-gray-1000)"
        strokeWidth="1"
      />
    </svg>
  );
}

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string; a?: string; b?: string }>;
}) {
  const params = await searchParams;

  let eventId = params.evento ?? null;
  let loadError: unknown = null;
  let eventLabel: string | null = null;
  let accStations: Array<{ code: string; name: string }> = [];

  try {
    if (!eventId) {
      const { reports } = await fetchAceldatReports();
      eventId = reports[0] ? `ran-${reports[0].reportNumber}` : null;
    }
    if (eventId) {
      const { stations, detail } = await listEventStations(eventId);
      eventLabel = `M ${detail.magnitude.toFixed(1)} · ${detail.reference} · ${formatLimaDateTime(utcIsoToLimaIso(detail.timeUtcIso))}`;
      accStations = stations
        .filter((station) => station.hasWaveform)
        .map((station) => ({ code: station.code, name: station.name }));
    }
  } catch (error) {
    loadError = error;
  }

  const stationA =
    params.a && accStations.some((s) => s.code === params.a) ? params.a : null;
  const stationB =
    params.b && accStations.some((s) => s.code === params.b) ? params.b : null;

  let waveformA: WaveformView | null = null;
  let waveformB: WaveformView | null = null;
  let compareError: unknown = null;
  if (eventId && stationA && stationB && stationA !== stationB) {
    try {
      [waveformA, waveformB] = await Promise.all([
        getWaveformView(eventId, stationA),
        getWaveformView(eventId, stationB),
      ]);
    } catch (error) {
      compareError = error;
    }
  }

  const comparison =
    waveformA && waveformB
      ? {
          nearer:
            waveformA.header.epicentralDistanceKm <=
            waveformB.header.epicentralDistanceKm
              ? waveformA
              : waveformB,
          farther:
            waveformA.header.epicentralDistanceKm <=
            waveformB.header.epicentralDistanceKm
              ? waveformB
              : waveformA,
        }
      : null;
  const attenuationHolds =
    comparison !== null &&
    maxPga(comparison.nearer) >= maxPga(comparison.farther);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-800">
        <Link href="/aula" className="hover:underline">
          Aula
        </Link>{" "}
        / Laboratorio
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">
            Laboratorio: compara dos estaciones
          </h1>
          <p className="text-sm text-gray-900">
            Un mismo sismo, dos registros distintos. El estado del laboratorio
            vive en la URL.
          </p>
          {eventLabel ? (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono">{eventLabel}</span>{" "}
              <ClassBadge value="official" />
            </p>
          ) : null}
        </div>
        <CopyLinkButton />
      </header>

      {loadError ? (
        <SourceErrorState
          error={loadError}
          context="No pudimos cargar el evento y sus estaciones desde ACELDAT."
        />
      ) : (
        <form
          method="get"
          className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-3"
        >
          <input type="hidden" name="evento" value={eventId ?? ""} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-900">Estación A</span>
            <select
              name="a"
              defaultValue={stationA ?? ""}
              className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
            >
              <option value="">Elegir…</option>
              {accStations.map((station) => (
                <option key={station.code} value={station.code}>
                  {station.code} · {station.name.slice(0, 40)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-900">Estación B</span>
            <select
              name="b"
              defaultValue={stationB ?? ""}
              className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
            >
              <option value="">Elegir…</option>
              {accStations.map((station) => (
                <option key={station.code} value={station.code}>
                  {station.code} · {station.name.slice(0, 40)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded bg-official px-3 py-2 text-sm font-medium text-background-100 hover:bg-gray-900"
            >
              Comparar
            </button>
          </div>
        </form>
      )}

      {compareError ? (
        <SourceErrorState
          error={compareError}
          context="No pudimos descargar las ondas de una de las estaciones."
        />
      ) : null}

      {waveformA && waveformB && comparison ? (
        <section
          aria-labelledby="comparacion"
          className="space-y-4"
          data-testid="lab-comparison"
        >
          <h2 id="comparacion" className="font-semibold">
            Comparación
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Distancia y aceleración máxima por estación comparada
              </caption>
              <thead>
                <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
                  <th scope="col" className="py-1.5 pr-2">
                    Estación
                  </th>
                  <th scope="col" className="py-1.5 pr-2">
                    Distancia epicentral <ClassBadge value="official" />
                  </th>
                  <th scope="col" className="py-1.5 pr-2">
                    PGA máx (cm/s2) <ClassBadge value="derived" />
                  </th>
                  <th scope="col" className="py-1.5">
                    PGA Z / N / E
                  </th>
                </tr>
              </thead>
              <tbody>
                {[waveformA, waveformB].map((waveform) => (
                  <tr
                    key={waveform.stationId}
                    className="border-b border-gray-100"
                  >
                    <th scope="row" className="py-1.5 pr-2 text-left font-mono">
                      {waveform.header.stationCode}
                    </th>
                    <td className="py-1.5 pr-2 font-mono">
                      {waveform.header.epicentralDistanceKm} km
                    </td>
                    <td className="py-1.5 pr-2 font-mono font-semibold">
                      {maxPga(waveform).toFixed(4)}
                    </td>
                    <td className="py-1.5 font-mono text-xs">
                      {waveform.computedPga.z.toFixed(3)} /{" "}
                      {waveform.computedPga.n.toFixed(3)} /{" "}
                      {waveform.computedPga.e.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[waveformA, waveformB].map((waveform) => (
              <figure key={waveform.stationId}>
                <figcaption className="mb-1 text-xs text-gray-900">
                  <span className="font-mono font-semibold">
                    {waveform.header.stationCode}
                  </span>{" "}
                  · componente N · escala propia
                </figcaption>
                <MiniWave
                  waveform={waveform}
                  label={waveform.header.stationCode}
                />
              </figure>
            ))}
          </div>

          <div
            className="rounded-lg border border-explanation bg-explanation-soft p-4 text-sm"
            data-testid="guided-explanation"
          >
            <p className="flex items-center gap-2 font-semibold text-explanation">
              <ClassBadge value="explanation" /> Qué estás viendo
            </p>
            <p className="mt-2 text-gray-800">
              {attenuationHolds
                ? `${comparison.nearer.header.stationCode} está más cerca del epicentro (${comparison.nearer.header.epicentralDistanceKm} km contra ${comparison.farther.header.epicentralDistanceKm} km) y registró mayor aceleración máxima. Ese es el patrón general: la sacudida tiende a atenuarse con la distancia.`
                : `${comparison.farther.header.stationCode} está más lejos del epicentro y aun así registró mayor aceleración máxima. La distancia no es el único factor: el tipo de suelo, la profundidad del sismo y la dirección de la ruptura también cambian lo que registra cada estación.`}
            </p>
            <p className="mt-2 text-xs text-gray-900">
              Explicación comunitaria pendiente de revisión científica. No es
              una evaluación de peligro ni una recomendación.
            </p>
          </div>
        </section>
      ) : !loadError ? (
        <p className="text-sm text-gray-900" data-testid="lab-empty">
          Elige dos estaciones distintas para comparar sus registros.
        </p>
      ) : null}
    </div>
  );
}
