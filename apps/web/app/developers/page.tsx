import Link from "next/link";

export const metadata = { title: "Developers" };

const RESOURCES = [
  {
    href: "/api",
    title: "Referencia de la API",
    description:
      "Contrato OpenAPI con referencia interactiva (Scalar): endpoints /v1, esquemas y consultas de prueba.",
  },
  {
    href: "/api/v1/openapi.json",
    title: "OpenAPI JSON",
    description:
      "El documento OpenAPI 3.1 es la fuente de verdad de documentación y validación.",
  },
  {
    href: "/fuentes",
    title: "Estado de Fuentes",
    description:
      "Lo que observa nuestro consumidor sobre las fuentes públicas que usa este proyecto.",
  },
];

export default function DevelopersPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Developers</h1>
        <p className="text-sm text-gray-900">
          API, CLI y Estado de Fuentes sobre el mismo núcleo normalizado con
          procedencia.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((resource) => (
          <li
            key={resource.href}
            className="rounded-lg border border-gray-200 p-4"
          >
            <Link
              href={resource.href}
              className="font-semibold text-official hover:underline"
            >
              {resource.title}
            </Link>
            <p className="mt-1 text-sm text-gray-900">{resource.description}</p>
          </li>
        ))}
      </ul>
      <section
        aria-labelledby="agents-titulo"
        className="rounded-lg border border-gray-1000 p-4"
        data-testid="coding-agents"
      >
        <h2
          id="agents-titulo"
          className="font-semibold text-[16px] text-gray-1000"
        >
          Úsalo con coding agents
        </h2>
        <p className="mt-1 text-[14px] text-gray-900">
          Instala la skill de `sismo` y tu agente (Claude Code, Cursor, Codex…)
          aprende a operar cada vertical — sismos, ondas, volcanes, verificación
          y salud de fuentes — con salida JSON, exit codes estables y
          procedencia en cada respuesta.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-gray-1000 p-3 font-mono text-[13px] text-background-100">
          {`npx skills add crafter-research/sismo-abierto`}
        </pre>
        <p className="mt-2 font-mono text-[11px] text-gray-800">
          Introspección en runtime: `sismo skill` imprime la documentación
          agent-first completa · `--open` abre la fuente oficial de cualquier
          dato
        </p>
      </section>

      <section aria-labelledby="cli-titulo">
        <h2 id="cli-titulo" className="mb-2 font-semibold text-gray-1000">
          CLI `sismo`
        </h2>
        <p className="text-sm text-gray-900">
          El binario `sismo` consume los mismos adaptadores normalizados que
          esta web y la API.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-gray-300 bg-background-200 p-3 font-mono text-[13px] text-gray-1000">
          {`sismo latest
sismo events --since 7d --min-magnitude 4 --format geojson
sismo inspect EVENT_ID
sismo stations EVENT_ID --sort pga
sismo waveform EVENT_ID STATION_ID --format csv
sismo volcanoes
sismo volcano VOLCANO_SLUG
sismo sources
sismo source SOURCE_ID --evidence
sismo schema COMMAND`}
        </pre>
        <p className="mt-2 font-mono text-[11px] text-gray-800">
          Salida humana en tablas · --json, --geojson y --csv sin decoración ·
          errores a stderr con códigos de salida estables
        </p>
      </section>

      <section aria-labelledby="badges-titulo">
        <h2 id="badges-titulo" className="mb-2 font-semibold text-gray-1000">
          Badges de fuentes
        </h2>
        <p className="text-sm text-gray-900">
          Cada fuente ofrece un SVG cacheable con el estado observado por
          nuestro consumidor. No representa el estado interno del IGP.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-gray-300 bg-background-200 p-3 font-mono text-[13px] text-gray-1000">
          {`/api/v1/sources/igp-aceldat/badge.svg`}
        </pre>
      </section>

      <section className="rounded-lg border border-gray-200 p-4 text-sm text-gray-900">
        <h2 className="font-semibold text-gray-1000">
          Principios del contrato
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            Cada respuesta incluye fuente, hora de consulta, procedencia y
            limitaciones.
          </li>
          <li>No hay SDKs mantenidos a mano: el contrato es OpenAPI.</li>
          <li>Los datasets se consultan en origen; no se redistribuyen.</li>
          <li>
            Sin API keys en esta etapa. Sé conservador con la frecuencia de tus
            consultas.
          </li>
        </ul>
      </section>
    </div>
  );
}
