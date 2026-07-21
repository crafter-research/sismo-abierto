import { LESSONS } from "@sismo/aula-content";
import Link from "next/link";
import { ClassBadge } from "../../components/badges";
import { AulaProgress } from "../../components/knowledge-check";

export const metadata = { title: "Aula Sísmica" };

const UPCOMING = [
  "Profundidad, distancia y por qué cambia lo que sentimos",
  "Qué representan Z, N, E y PGA",
  "Predicción, pronóstico y alerta temprana no son lo mismo",
];

export default function AulaPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Aula Sísmica</h1>
        <p className="text-sm text-gray-600">
          Lecciones cortas construidas sobre eventos reales del IGP. Sin
          cuentas: el progreso vive en tu navegador.
        </p>
        <div className="mt-2">
          <AulaProgress totalLessons={LESSONS.length + UPCOMING.length} />
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
            <p className="mt-1 text-sm text-gray-600">{lesson.summary}</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <ClassBadge value="explanation" />
              Contenido comunitario v{lesson.version}, pendiente de revisión
              científica.
            </p>
          </li>
        ))}
        {UPCOMING.map((title) => (
          <li
            key={title}
            className="rounded-lg border border-dashed border-gray-300 p-4"
          >
            <p className="font-semibold text-gray-400">{title}</p>
            <p className="mt-1 text-xs text-gray-400">Próximamente.</p>
          </li>
        ))}
      </ul>

      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold">Laboratorio sísmico</h2>
        <p className="mt-1 text-sm text-gray-600">
          Compara dos estaciones de un evento real y observa cómo cambian la
          aceleración y la distancia. El estado del laboratorio se comparte por
          URL.
        </p>
        <Link
          href="/aula/laboratorio"
          className="mt-3 inline-block rounded bg-official px-3 py-1.5 text-sm font-medium text-background-100 hover:bg-gray-900"
        >
          Abrir laboratorio →
        </Link>
      </div>
    </div>
  );
}
