import { getLesson, LESSONS } from "@sismo/aula-content";
import { fetchAceldatReports, utcIsoToLimaIso } from "@sismo/data";
import type { Metadata } from "next";
import Link from "next/link";
import { ClassBadge } from "../../../components/badges";
import { SourceErrorState } from "../../../components/error-state";
import { KnowledgeCheck } from "../../../components/knowledge-check";
import { formatLimaDateTime } from "../../../lib/format";

export const revalidate = 3600;

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) {
    return { title: "Lección no encontrada", robots: { index: false } };
  }
  return {
    title: lesson.title,
    description: lesson.summary,
    alternates: { canonical: `/aula/${lesson.slug}` },
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) {
    return (
      <p className="text-sm text-gray-900">
        Esta lección no existe.{" "}
        <Link href="/aula" className="text-official underline">
          Volver al Aula
        </Link>
      </p>
    );
  }

  let realEvent: {
    id: string;
    magnitude: number;
    reference: string;
    timeLocal: string | null;
  } | null = null;
  let eventError: unknown = null;
  try {
    const { reports } = await fetchAceldatReports();
    const latest = reports[0];
    if (latest) {
      realEvent = {
        id: `ran-${latest.reportNumber}`,
        magnitude: latest.magnitude,
        reference: latest.reference,
        timeLocal: utcIsoToLimaIso(latest.timeUtcIso),
      };
    }
  } catch (error) {
    eventError = error;
  }

  return (
    <div className="space-y-6">
      <nav className="text-xs text-gray-800">
        <Link href="/aula" className="hover:underline">
          Aula
        </Link>{" "}
        / {lesson.title}
      </nav>

      <header>
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        <p className="mt-1 text-sm text-gray-900">{lesson.summary}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-gray-800">
          <ClassBadge value="explanation" />
          Contenido comunitario v{lesson.version}, pendiente de revisión
          científica. Cada afirmación enlaza su fuente.
        </p>
      </header>

      <section aria-labelledby="conceptos" className="space-y-3">
        <h2 id="conceptos" className="font-semibold">
          Conceptos
        </h2>
        <ul className="space-y-3">
          {lesson.claims.map((claim) => (
            <li
              key={claim.text}
              className="rounded-lg border border-gray-200 p-3 text-sm"
            >
              <p>{claim.text}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-800">
                <ClassBadge value="explanation" />
                {claim.sourceUrl ? (
                  <a
                    href={claim.sourceUrl}
                    className="text-official underline"
                    rel="noreferrer"
                  >
                    Fuente: {claim.sourceName}
                  </a>
                ) : (
                  "Sin fuente externa"
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="evento-real">
        <h2 id="evento-real" className="font-semibold">
          Evento real para esta lección
        </h2>
        {realEvent ? (
          <div
            className="mt-2 rounded-lg border border-gray-200 p-4"
            data-testid="lesson-event"
          >
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold text-official">
                M {realEvent.magnitude.toFixed(1)}
              </span>
              <span>{realEvent.reference}</span>
              <ClassBadge value="official" />
            </p>
            <p className="mt-1 font-mono text-xs text-gray-900">
              {formatLimaDateTime(realEvent.timeLocal)}
            </p>
            <p className="mt-2 text-sm text-gray-900">{lesson.eventPrompt}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href={`/sismos/${realEvent.id}`}
                className="rounded border border-official px-3 py-1.5 text-sm font-medium text-official hover:bg-official-soft"
              >
                Ver el evento
              </Link>
              {lesson.showLaboratory ? (
                <Link
                  href={`/aula/laboratorio?evento=${realEvent.id}`}
                  className="rounded bg-official px-3 py-1.5 text-sm font-medium text-background-100 hover:bg-gray-900"
                >
                  Abrir laboratorio con este evento →
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <SourceErrorState
              error={eventError}
              context="No pudimos cargar un evento real desde ACELDAT para esta lección."
            />
          </div>
        )}
      </section>

      <section aria-labelledby="pregunta">
        <h2 id="pregunta" className="mb-2 font-semibold">
          Comprueba lo aprendido
        </h2>
        <KnowledgeCheck lessonSlug={lesson.slug} question={lesson.question} />
      </section>

      <section aria-labelledby="fuentes-leccion">
        <h2 id="fuentes-leccion" className="font-semibold">
          Fuentes de esta lección
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
          {lesson.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                className="text-official underline"
                rel="noreferrer"
              >
                {source.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
