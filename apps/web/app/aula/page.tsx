import { LESSONS } from "@sismo/aula-content";
import Link from "next/link";
import { ClassBadge } from "../../components/badges";
import { AulaProgress } from "../../components/knowledge-check";

export const metadata = { title: "Aula Sísmica" };

export default function AulaPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Aula Sísmica</h1>
        <p className="text-sm text-gray-900">
          Lecciones cortas construidas sobre eventos reales del IGP. Sin
          cuentas: el progreso vive en tu navegador.
        </p>
        <div className="mt-2">
          <AulaProgress totalLessons={LESSONS.length} />
        </div>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2" data-testid="lesson-list">
        {LESSONS.map((lesson) => (
          <li
            key={lesson.slug}
            className="rounded-lg border border-gray-200 p-4"
          >
            <Link
              href={`/aula/${lesson.slug}`}
              className="font-semibold text-official hover:underline"
            >
              {lesson.title}
            </Link>
            <p className="mt-1 text-sm text-gray-900">{lesson.summary}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-gray-800">
              <ClassBadge value="explanation" />
              Contenido comunitario v{lesson.version}, pendiente de revisión
              científica.
            </p>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold">Comparador de eventos</h2>
          <p className="mt-1 text-sm text-gray-900">
            Pon dos sismos reales lado a lado y compara lugar, magnitud y
            profundidad con datos del IGP.
          </p>
          <Link
            href="/aula/comparador"
            className="mt-3 inline-block rounded bg-official px-3 py-1.5 text-sm font-medium text-background-100 hover:bg-gray-900"
          >
            Comparar eventos →
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold">Laboratorio sísmico</h2>
          <p className="mt-1 text-sm text-gray-900">
            Compara dos estaciones de un evento real y observa cómo cambian la
            aceleración y la distancia. El estado vive en la URL.
          </p>
          <Link
            href="/aula/laboratorio"
            className="mt-3 inline-block rounded border border-official px-3 py-1.5 text-sm font-medium text-official hover:bg-official-soft"
          >
            Comparar estaciones →
          </Link>
        </div>
      </div>
    </div>
  );
}
