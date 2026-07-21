import { buildVolcanoDetailResponse } from "@sismo/data";
import {
  EXPLANATION_DISCLAIMER,
  explanationForLevel,
  VA3_BLOCKED_NOTICE,
} from "@sismo/volcanoes";
import Link from "next/link";
import { ClassBadge, SourceBadge } from "../../../components/badges";
import { SourceErrorState } from "../../../components/error-state";
import { levelChip } from "../../../lib/volcano-ui";

export const dynamic = "force-dynamic";

export default async function VolcanoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let result: Awaited<ReturnType<typeof buildVolcanoDetailResponse>> | null =
    null;
  let loadError: unknown = null;
  try {
    result = await buildVolcanoDetailResponse(slug);
  } catch (error) {
    loadError = error;
  }

  if (loadError) {
    return (
      <SourceErrorState
        error={loadError}
        context="No pudimos consultar la capa volcánica publicada por la IDE del IGP."
      />
    );
  }
  if (!result) {
    return (
      <p className="text-sm text-gray-600">
        No existe el volcán "{slug}" en la capa publicada.{" "}
        <Link href="/volcanes" className="text-official underline">
          Volver al índice
        </Link>
      </p>
    );
  }

  const volcano = result.volcano;
  const explanation = explanationForLevel(volcano.publishedLevel);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-500">
        <Link href="/volcanes" className="hover:underline">
          Volcanes
        </Link>{" "}
        / {volcano.name}
      </nav>

      <header
        className="rounded-lg border border-gray-200 p-4"
        data-testid="published-state"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{volcano.name}</h1>
          <span className="text-gray-600">{volcano.region}</span>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">PUBLISHED_STATE:</span>
          <span
            className={`rounded px-2 py-0.5 font-semibold ${levelChip(volcano.publishedLevel)}`}
          >
            {volcano.publishedLevel || "Sin nivel publicado"}
          </span>
          <ClassBadge value="official" />
        </p>
        <p
          className="mt-1 flex flex-wrap items-center gap-2 text-sm"
          data-testid="freshness-state"
        >
          <span className="text-gray-500">Vigencia:</span>
          <span className="rounded bg-missing-soft px-2 py-0.5 font-mono text-xs text-missing">
            FRESHNESS_UNKNOWN
          </span>
          <span className="text-xs text-gray-500">
            La fuente no publica fecha de actualización por registro.
          </span>
        </p>
        <div className="mt-3">
          <SourceBadge provenance={volcano.provenance} />
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold">Ubicación y reseña</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500">Coordenadas:</dt>
              <dd className="font-mono">
                {volcano.latitude}, {volcano.longitude}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500">Actividad publicada:</dt>
              <dd>
                {volcano.publishedActivity || "Sin descripción publicada"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-gray-700">
            {volcano.publishedReview}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <ClassBadge value="official" /> Texto recibido de la fuente, sin
            edición.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-explanation bg-explanation-soft p-4">
            <h2 className="flex items-center gap-2 font-semibold text-explanation">
              <ClassBadge value="explanation" /> Qué suele significar este nivel
            </h2>
            <p
              className="mt-2 text-sm text-gray-800"
              data-testid="level-explainer"
            >
              {explanation
                ? explanation.meaning
                : "No tenemos una explicación educativa para este nivel publicado."}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              {EXPLANATION_DISCLAIMER}
            </p>
          </div>

          <div
            className="rounded-lg border border-gray-300 border-dashed bg-missing-soft p-4"
            data-testid="bulletin-timeline-blocked"
          >
            <h2 className="flex items-center gap-2 font-semibold text-missing">
              <ClassBadge value="unavailable" /> Publicaciones oficiales
              fechadas
            </h2>
            <p className="mt-2 text-sm text-gray-700">{VA3_BLOCKED_NOTICE}</p>
            <p className="mt-2 text-xs text-gray-600">
              Mientras tanto puedes buscar publicaciones sobre este volcán
              directamente en el{" "}
              <a
                href={`https://repositorio.igp.gob.pe/search?query=${encodeURIComponent(volcano.name)}`}
                className="text-official underline"
                rel="noreferrer"
              >
                Repositorio Geofísico Nacional
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
