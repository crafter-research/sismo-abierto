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
        <p className="text-sm text-gray-600">
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
            <p className="mt-1 text-sm text-gray-600">{resource.description}</p>
          </li>
        ))}
      </ul>
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
sismo source SOURCE_ID --evidence`}
        </pre>
        <p className="mt-2 font-mono text-[11px] text-gray-700">
          Salida humana en tablas · --json, --geojson y --csv sin decoración ·
          errores a stderr con códigos de salida estables
        </p>
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
