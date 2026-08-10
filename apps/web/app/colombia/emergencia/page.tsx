import { COLOMBIA_INCIDENT, getIncidentView } from "@sismo/incidents";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "../../../components/auto-refresh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Emergencia por sismo M 7.4 en Colombia",
  description:
    "Información oficial, cortes humanitarios versionados y recursos verificados sobre el sismo M 7.4 de San José del Palmar, Chocó, Colombia.",
  alternates: { canonical: "/colombia/emergencia" },
  openGraph: {
    title: "Emergencia por sismo M 7.4 en Colombia",
    description:
      "Situación oficial, historial de actualizaciones y recursos verificados para ayudar sin amplificar información falsa.",
    url: "/colombia/emergencia",
  },
};

const OFFICIAL_LINKS = [
  {
    href: "https://www.sgc.gov.co/detallesismo/SGC2026pqqmro/resumen",
    label: "Detalle sísmico del SGC",
    description: "Magnitud, profundidad, ubicación y revisiones del evento.",
  },
  {
    href: "https://www.gestiondelriesgo.gov.co/",
    label: "Unidad Nacional para la Gestión del Riesgo",
    description: "Comunicados y coordinación oficial de la emergencia.",
  },
  {
    href: "https://repositorio.gestiondelriesgo.gov.co/bitstream/handle/20.500.11762/36815/Riesgo-Sismico.html",
    label: "Qué hacer después de un sismo",
    description: "Recomendaciones oficiales de gestión del riesgo.",
  },
] as const;

function formatBogotaDate(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

const FRESHNESS_LABELS = {
  FRESH: "al día",
  DELAYED: "con demora",
  STALE: "desactualizada",
  UNKNOWN: "sin confirmar",
} as const;

export default async function ColombiaEmergencyPage() {
  const view = await getIncidentView(COLOMBIA_INCIDENT.slug);
  if (!view) notFound();
  const { incident, seismic, humanitarian } = view;
  const magnitude = seismic?.event.magnitude ?? 7.4;
  const dateModified = seismic?.syncedAt ?? humanitarian.publishedAt;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Emergencia por sismo M ${magnitude.toFixed(1)} en Colombia`,
    description:
      "Información oficial y recursos verificados sobre el sismo de San José del Palmar, Chocó.",
    dateModified,
    spatialCoverage: "Colombia",
    isBasedOn: OFFICIAL_LINKS.slice(0, 2).map((source) => source.href),
  };

  return (
    <article className="mx-auto w-full max-w-4xl space-y-8">
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <nav className="text-xs text-gray-800">
        <Link href="/colombia" className="hover:underline">
          Colombia
        </Link>{" "}
        / Emergencia
      </nav>

      <header className="border-2 border-sem-red bg-gray-1000 p-5 text-background-100 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-sem-red text-xs uppercase tracking-[0.16em]">
            Emergencia en actualización
          </p>
          <span className="border border-background-100/30 px-2 py-1 font-mono text-[10px] uppercase">
            SGC {seismic ? FRESHNESS_LABELS[seismic.freshness] : "sin conexión"}
          </span>
        </div>
        <h1 className="mt-2 max-w-3xl font-semibold text-3xl tracking-tight sm:text-5xl">
          Sismo M {magnitude.toFixed(1)} en {incident.location}
        </h1>
        <p className="mt-4 max-w-2xl text-background-100/75">
          Esta página reúne parámetros sísmicos automáticos, cortes humanitarios
          revisados y recursos oficiales. No es un canal de emergencia.
        </p>
        {seismic ? (
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-background-100/75">
            <div>
              <dt className="uppercase">Profundidad</dt>
              <dd className="text-background-100">
                {seismic.event.depthKm} km
              </dd>
            </div>
            <div>
              <dt className="uppercase">Estado SGC</dt>
              <dd className="text-background-100">
                {seismic.event.reviewStatus ?? "automático"}
              </dd>
            </div>
            <div>
              <dt className="uppercase">Sincronizado</dt>
              <dd className="text-background-100">
                {formatBogotaDate(seismic.syncedAt)}
              </dd>
            </div>
          </dl>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/sismos/${incident.eventId}`}
            className="inline-flex h-10 items-center bg-background-100 px-4 font-medium text-[14px] text-gray-1000 hover:bg-background-200"
          >
            Ver evento sísmico
          </Link>
          <a
            href="https://www.gestiondelriesgo.gov.co/"
            className="inline-flex h-10 items-center border border-background-100/35 px-4 font-medium text-[14px] text-background-100 hover:border-background-100"
            rel="noreferrer"
            target="_blank"
          >
            Abrir UNGRD
          </a>
        </div>
      </header>

      <section aria-labelledby="situacion-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] text-gray-800 uppercase tracking-widest">
              Último corte revisado
            </p>
            <h2 id="situacion-title" className="mt-1 font-semibold text-2xl">
              Situación reportada
            </h2>
          </div>
          <p className="font-mono text-[11px] text-gray-800">
            {formatBogotaDate(humanitarian.source.issuedAt)}
          </p>
        </div>
        <dl className="mt-4 grid grid-cols-2 border-gray-300 border-t border-l sm:grid-cols-3">
          {humanitarian.facts.map((fact) => (
            <div
              key={fact.key}
              className="border-gray-300 border-r border-b p-4"
            >
              <dd className="font-semibold text-3xl tracking-tight">
                {fact.displayValue}
              </dd>
              <dt className="mt-1 text-gray-900 text-sm">{fact.label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-gray-800 text-xs">
          <p>
            Fuente: {humanitarian.versionLabel} de {humanitarian.source.name}.
            Las cifras son preliminares y pueden cambiar.
          </p>
          <span className="font-mono">
            {view.storage === "database"
              ? "Historial persistido"
              : "Respaldo verificado"}
          </span>
        </div>
      </section>

      <section aria-labelledby="history-title">
        <p className="font-mono text-[11px] text-gray-800 uppercase tracking-widest">
          Trazabilidad
        </p>
        <h2 id="history-title" className="mt-1 font-semibold text-2xl">
          Historial de actualizaciones
        </h2>
        <ol className="mt-4 divide-y divide-gray-300 border-y border-gray-300">
          {view.history.slice(0, 8).map((entry) => (
            <li
              key={entry.id}
              className="grid gap-1 py-3 text-sm sm:grid-cols-[130px_1fr_auto] sm:items-center"
            >
              <span className="font-mono text-[11px] text-gray-800 uppercase">
                {entry.kind === "seismic"
                  ? "Dato sísmico"
                  : "Corte humanitario"}
              </span>
              <span>{entry.versionLabel}</span>
              <time className="font-mono text-[11px] text-gray-800">
                {formatBogotaDate(entry.observedAt)}
              </time>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-gray-800 text-xs">
            Los cambios sísmicos se guardan automáticamente. Los cortes de
            afectación requieren revisión antes de hacerse públicos.
          </p>
          <AutoRefresh seconds={60} />
        </div>
      </section>

      <section aria-labelledby="channels-title">
        <p className="font-mono text-[11px] text-gray-800 uppercase tracking-widest">
          Fuentes verificadas
        </p>
        <h2 id="channels-title" className="mt-1 font-semibold text-2xl">
          Canales oficiales
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {OFFICIAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="border border-gray-300 p-4 hover:border-gray-600 hover:bg-background-200"
              rel="noreferrer"
              target="_blank"
            >
              <h3 className="font-medium">{link.label}</h3>
              <p className="mt-2 text-gray-900 text-sm">{link.description}</p>
            </a>
          ))}
        </div>
        <div className="mt-4 border border-sem-red bg-sem-red-soft p-4">
          <p className="font-semibold text-sem-red">Emergencia inmediata</p>
          <p className="mt-1 text-sm">
            En Colombia, llama al 123 únicamente ante una emergencia real. No
            congestiones la línea para solicitar información general.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="help-title"
        className="border border-gray-300 bg-background-200 p-5 sm:p-6"
      >
        <p className="font-mono text-[11px] text-gray-800 uppercase tracking-widest">
          Ayudar sin hacer daño
        </p>
        <h2 id="help-title" className="mt-1 font-semibold text-2xl">
          Aportes verificados, no cadenas
        </h2>
        <div className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
          <div>
            <h3 className="font-semibold">Lo que sí puedes hacer</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-gray-900">
              <li>
                Compartir comunicados del SGC, UNGRD y autoridades locales.
              </li>
              <li>
                Conservar batería y conectividad para quienes la necesitan.
              </li>
              <li>
                Seguir instrucciones de evacuación y revisión estructural.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Lo que todavía no publicamos</h3>
            <p className="mt-2 text-gray-900">
              No mostraremos colectas, cuentas bancarias, refugios ni centros de
              acopio sin una fuente institucional verificable y una fecha
              visible.
            </p>
          </div>
        </div>
        <a
          href="https://github.com/crafter-research/sismo-abierto"
          className="mt-5 inline-flex h-10 items-center border border-gray-500 px-4 font-medium text-[14px] hover:border-gray-900 hover:bg-background-100"
          rel="noreferrer"
          target="_blank"
        >
          Aportar una fuente verificable
        </a>
      </section>
    </article>
  );
}
