import {
  describeIgpMatch,
  describeIngemmetMatch,
  LimaRiskStore,
  type NearestFault,
  queryPoint,
  riskLevelSpec,
  romanLevel,
  type StudyLevel,
  studyLevelLabel,
  whatItMeans,
} from "@sismo/terrain";
import type { Metadata } from "next";
import Link from "next/link";
import { ClassBadge } from "../../../components/badges";
import { formatDistanceMeters, formatFetchedAt } from "../../../lib/format";

export const dynamic = "force-dynamic";

const EXAMPLE_POINTS = [
  { label: "Lima", lon: -77.03, lat: -12.05 },
  { label: "Chosica", lon: -76.7, lat: -11.93 },
  { label: "Arequipa", lon: -71.54, lat: -16.4 },
];

const STUDY_LEVEL_BADGE: Record<
  StudyLevel,
  "official" | "derived" | "unavailable"
> = {
  microzonificacion: "official",
  nacional: "derived",
  ninguno: "unavailable",
};

interface PointSearchParams {
  lon?: string | string[];
  lat?: string | string[];
}

interface ParsedPoint {
  lon: number;
  lat: number;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value.at(-1) : value;
}

function parsePoint(params: PointSearchParams): ParsedPoint | null {
  const rawLon = firstValue(params.lon);
  const rawLat = firstValue(params.lat);
  if (!rawLon || !rawLat) return null;

  const lon = Number(rawLon);
  const lat = Number(rawLat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return null;

  return { lon, lat };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<PointSearchParams>;
}): Promise<Metadata> {
  const point = parsePoint(await searchParams);
  if (!point) {
    return {
      title: "Consultar terreno por coordenada",
      description:
        "Consultá qué estudios de suelo del IGP y de INGEMMET cubren un punto del Perú a partir de su longitud y latitud.",
    };
  }
  return {
    title: `Terreno en ${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}`,
    description: `Estudios de suelo del IGP y de INGEMMET publicados para el punto ${point.lat.toFixed(4)}, ${point.lon.toFixed(4)}.`,
  };
}

export default async function PointTerrainPage({
  searchParams,
}: {
  searchParams: Promise<PointSearchParams>;
}) {
  const point = parsePoint(await searchParams);
  if (!point) return <EmptyState />;

  if (!process.env.DATABASE_URL) return <MissingDatabaseState point={point} />;

  const databaseUrl = process.env.DATABASE_URL;
  const [terrain, limaRisk] = await Promise.all([
    queryPoint(point.lon, point.lat),
    // El estudio del CISMID solo cubre Lima y Callao: fuera de ahí devuelve
    // null y la sección no se renderiza.
    new LimaRiskStore(databaseUrl).atPoint(point.lon, point.lat),
  ]);
  const limaSpec = limaRisk ? riskLevelSpec(limaRisk.level) : null;

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-800">
        <Link href="/terreno" className="hover:underline">
          Terreno
        </Link>{" "}
        / <span>Punto</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold">
            {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
          </h1>
          <ClassBadge value={STUDY_LEVEL_BADGE[terrain.studyLevel]} />
        </div>
        <p className="mt-2 text-sm text-gray-900" data-testid="study-level">
          {studyLevelLabel(terrain.studyLevel)}
          {terrain.studyLevel === "nacional" ? (
            <span className="block text-xs text-gray-800">
              Es una escala 1:100 000: describe la geomorfología de la región,
              no un estudio hecho sobre tu cuadra.
            </span>
          ) : null}
          {terrain.studyLevel === "microzonificacion" ? (
            <span className="block text-xs text-gray-800">
              Es un estudio urbano detallado: cubre{" "}
              {terrain.cities.length === 1 ? "la ciudad" : "las ciudades"}{" "}
              {terrain.cities.join(" y ")}.
            </span>
          ) : null}
        </p>
      </header>

      <FaultProximitySection faults={terrain.nearestFaults} />

      {terrain.studyLevel === "ninguno" ? (
        <section
          className="rounded-lg border border-gray-200 p-4"
          data-testid="no-study"
        >
          <p className="text-sm text-gray-900">
            Ni el IGP ni INGEMMET publicaron un estudio de suelo que cubra este
            punto. Probá con otro punto o revisá la lista de ciudades con
            estudio.
          </p>
          <Link
            href="/terreno"
            className="mt-2 inline-block text-sm font-medium text-official underline"
          >
            Ver ciudades con estudio →
          </Link>
        </section>
      ) : null}

      {limaRisk && limaSpec ? (
        <section aria-labelledby="lima-riesgo-titulo" data-testid="lima-risk">
          <h2 id="lima-riesgo-titulo" className="mb-3 font-semibold">
            Riesgo sísmico de la vivienda
          </h2>
          <div className="rounded-lg border border-gray-300 p-4">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-1 size-4 shrink-0 rounded-[3px]"
                style={{ backgroundColor: limaSpec.ui }}
              />
              <div className="min-w-0 space-y-2">
                <p className="font-semibold text-gray-1000">
                  Nivel {romanLevel(limaSpec.level)} · {limaSpec.damage}
                </p>
                <p className="text-gray-900 text-sm leading-relaxed">
                  {whatItMeans(limaSpec.level)}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-gray-800">Costo de reparación</dt>
                    <dd className="font-medium text-gray-1000">
                      {limaSpec.repairCost}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-800">Distrito</dt>
                    <dd className="font-medium text-gray-1000">
                      {limaRisk.district}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-800">Año del estudio</dt>
                    <dd className="font-medium text-gray-1000">
                      {limaRisk.studyYear}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-800">Riesgo</dt>
                    <dd className="font-medium text-gray-1000">
                      {limaRisk.risk}
                    </dd>
                  </div>
                </dl>
                <p className="text-gray-800 text-xs leading-snug">
                  Estudio del CISMID-UNI. Es una estimación por zona: no
                  reemplaza la evaluación técnica de una vivienda concreta.{" "}
                  <Link
                    href="/terreno/lima"
                    className="underline underline-offset-2 hover:text-gray-1000"
                  >
                    Ver el mapa completo
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {terrain.igp.length > 0 ? (
        <section aria-labelledby="igp-titulo" data-testid="igp-matches">
          <h2 id="igp-titulo" className="mb-3 font-semibold">
            Estudio de microzonificación del IGP
          </h2>
          <div className="space-y-3">
            {terrain.igp.map((match, index) => {
              const description = describeIgpMatch(
                match.dimension,
                match.properties,
              );
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: mismo punto puede repetir dimension+city con properties distintas
                  key={`${match.dimension}-${match.city}-${index}`}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="font-mono text-xs text-gray-800">
                      {match.dimension}
                    </p>
                    <span className="text-xs text-gray-800">
                      ciudad: {match.city}
                    </span>
                  </div>
                  {description.primary ? (
                    <p
                      className="mt-1 text-sm font-semibold text-gray-900"
                      data-testid="igp-description"
                    >
                      {description.primary}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-800">
                      Sin descripción publicada para este dato.
                    </p>
                  )}
                  {description.secondary ? (
                    <p className="mt-0.5 font-mono text-xs text-gray-800">
                      {description.secondary}
                    </p>
                  ) : null}
                  {match.studyYear ? (
                    <p className="mt-1 text-xs text-gray-800">
                      estudio de {match.studyYear}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {terrain.ingemmet.length > 0 ? (
        <section
          aria-labelledby="ingemmet-titulo"
          data-testid="ingemmet-matches"
        >
          <h2 id="ingemmet-titulo" className="mb-3 font-semibold">
            Cobertura geomorfológica nacional de INGEMMET
          </h2>
          <div className="space-y-3">
            {terrain.ingemmet.map((match, index) => {
              const description = describeIngemmetMatch(
                match.layer,
                match.properties,
              );
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: mismo punto puede repetir layer con properties distintas
                  key={`${match.layer}-${index}`}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <p className="font-mono text-xs text-gray-800">
                    {match.layer}
                  </p>
                  {description ? (
                    <p
                      className="mt-1 text-sm font-semibold text-gray-900"
                      data-testid="ingemmet-description"
                    >
                      {description}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-800">
                      Sin descripción publicada para este dato.
                    </p>
                  )}
                  <div
                    className="mt-2 text-xs text-gray-900"
                    data-testid="ingemmet-attribution"
                  >
                    <p>Fuente: {match.attribution}</p>
                    <p>
                      Consultado:{" "}
                      <span className="font-mono">
                        {formatFetchedAt(match.fetchedAt)}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-800">
            INGEMMET no es responsable de las interpretaciones que esta
            plataforma hace de sus datos.
          </p>
        </section>
      ) : null}
    </div>
  );
}

/**
 * Proximidad a fallas de INGEMMET, independiente del `studyLevel`: una falla
 * puede estar cerca de un punto sin microzonificación ni cobertura geomorfológica.
 * Copy deliberadamente sin alarmismo: la escala 1:100 000 de INGEMMET implica
 * cientos de metros de incertidumbre en la posición de la línea, y estar cerca
 * de una falla mapeada no es sinónimo de peligro inmediato.
 */
function FaultProximitySection({ faults }: { faults: NearestFault[] }) {
  if (faults.length === 0) return null;

  const nearest = faults[0];
  if (!nearest) return null;

  return (
    <section
      className="rounded-lg border border-gray-200 p-4"
      data-testid="fault-proximity"
    >
      <h2 className="mb-2 font-semibold">Proximidad a fallas geológicas</h2>
      <p className="text-sm text-gray-900" data-testid="nearest-fault">
        {nearest.isConfirmedFault
          ? `${nearest.description} a ${formatDistanceMeters(nearest.distanceMeters)}`
          : `${nearest.description} (rasgo lineal sin confirmar como falla) a ${formatDistanceMeters(nearest.distanceMeters)}`}
      </p>
      {faults.length > 1 ? (
        <ul className="mt-1 space-y-0.5 text-xs text-gray-800">
          {faults.slice(1).map((fault) => (
            <li key={`${fault.description}-${fault.distanceMeters}`}>
              {fault.description}
              {fault.isConfirmedFault ? "" : " (sin confirmar)"} a{" "}
              {formatDistanceMeters(fault.distanceMeters)}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-xs text-gray-800">
        Estar cerca de una falla mapeada no significa peligro inmediato: la
        mayoría de fallas no rompen la superficie en un sismo. El mapeo de
        INGEMMET es a escala 1:100 000, así que la posición de la línea tiene
        una incertidumbre de cientos de metros.
      </p>
    </section>
  );
}

function MissingDatabaseState({ point }: { point: ParsedPoint }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">
          {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
        </h1>
      </header>
      <section
        className="rounded-lg border border-gray-200 p-4"
        data-testid="no-database"
      >
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="font-semibold">Base de datos no configurada</h2>
          <ClassBadge value="unavailable" />
        </div>
        <p className="mt-2 text-sm text-gray-900">
          Esta consulta necesita <code className="font-mono">DATABASE_URL</code>{" "}
          para leer los estudios de terreno. En este entorno esa variable no
          está disponible.
        </p>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Consultar terreno por coordenada</h1>
        <p className="mt-2 text-sm text-gray-900" data-testid="scope-notice">
          Ingresá una longitud y una latitud del Perú para ver qué estudios de
          suelo del IGP y de INGEMMET cubren ese punto.
        </p>
      </header>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-4"
        data-testid="point-form"
      >
        <label className="flex flex-col text-xs text-gray-800">
          Longitud
          <input
            type="number"
            name="lon"
            step="any"
            min={-180}
            max={180}
            required
            className="mt-1 rounded border border-gray-200 px-2 py-1 text-sm text-gray-900"
          />
        </label>
        <label className="flex flex-col text-xs text-gray-800">
          Latitud
          <input
            type="number"
            name="lat"
            step="any"
            min={-90}
            max={90}
            required
            className="mt-1 rounded border border-gray-200 px-2 py-1 text-sm text-gray-900"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-official px-3 py-1.5 text-sm font-medium text-official-soft"
        >
          Consultar
        </button>
      </form>

      <section aria-labelledby="ejemplos-titulo">
        <h2 id="ejemplos-titulo" className="mb-3 font-semibold">
          Puntos de ejemplo
        </h2>
        <ul
          className="flex flex-wrap gap-x-4 gap-y-1 text-sm"
          data-testid="example-points"
        >
          {EXAMPLE_POINTS.map((example) => (
            <li key={example.label}>
              <Link
                href={`/terreno/punto?lon=${example.lon}&lat=${example.lat}`}
                className="font-medium text-official underline"
              >
                {example.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
