import { GEOGRAPHY_METHOD_NOTE } from "@sismo/audit";
import Link from "next/link";

export const metadata = { title: "Metodología · Verifica Sismos" };

export default function MethodologyPage() {
  return (
    <div className="prose-sm max-w-3xl space-y-5 text-sm text-gray-800">
      <nav className="text-xs text-gray-800">
        <Link href="/verifica" className="hover:underline">
          Verifica
        </Link>{" "}
        / Metodología
      </nav>
      <h1 className="text-xl font-bold text-gray-900">
        Protocolo de auditoría (congelado)
      </h1>
      <p>
        Este protocolo se congeló el 20 de julio de 2026, antes de conocer los
        resultados de las ventanas. El objetivo es evaluar las ocho proyecciones
        publicadas sin redefinir después qué constituye un acierto. La versión
        de referencia vive en{" "}
        <span className="font-mono">data/predictions/audit-protocol.md</span> y
        su historial en git.
      </p>

      <h2 className="font-semibold text-gray-900">Fuentes</h2>
      <ol className="list-inside list-decimal space-y-1">
        <li>IGP/CENSIS como fuente principal para epicentros en el Perú.</li>
        <li>USGS FDSN Event API para el catálogo global y contraste.</li>
        <li>
          Si las fuentes discrepan en magnitud, ubicación o tiempo de forma que
          cambia la calificación, se conservan ambos valores y el caso se marca{" "}
          <span className="font-mono">SOURCE_DISAGREEMENT</span>.
        </li>
      </ol>

      <h2 className="font-semibold text-gray-900">Criterios por evento</h2>
      <p>Un evento es candidato solo si cumple simultáneamente:</p>
      <ol className="list-inside list-decimal space-y-1">
        <li>
          Su hora de origen (no la de publicación) cae dentro de la ventana
          congelada.
        </li>
        <li>
          Su magnitud cae dentro del intervalo publicado, incluyendo ambos
          extremos.
        </li>
        <li>Su epicentro está dentro de uno de los destinos publicados.</li>
      </ol>

      <h2 className="font-semibold text-gray-900">Geografía</h2>
      <p>{GEOGRAPHY_METHOD_NOTE}</p>

      <h2 className="font-semibold text-gray-900">Resultados permitidos</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>
          <span className="font-mono">STRICT_HIT</span>: coincide tiempo,
          magnitud y una geografía inequívoca.
        </li>
        <li>
          <span className="font-mono">NO_MATCH</span>: no existe coincidencia en
          los destinos con límites inequívocos.
        </li>
        <li>
          <span className="font-mono">AMBIGUOUS_GEOGRAPHY</span>: la
          coincidencia depende de una descripción territorial vaga o de la
          frontera de la aproximación geográfica.
        </li>
        <li>
          <span className="font-mono">SOURCE_DISAGREEMENT</span>: las fuentes
          oficiales no permiten una conclusión única.
        </li>
        <li>
          <span className="font-mono">PENDING</span>: la ventana todavía no
          termina.
        </li>
      </ul>

      <h2 className="font-semibold text-gray-900">Control contra azar</h2>
      <p>
        Para cada predicción se consultan los 365 días anteriores a la ventana
        con la misma geografía y rango de magnitud, se calcula la tasa histórica
        de eventos por día y se estima la probabilidad de al menos una
        coincidencia durante la ventana (modelo de Poisson). Un acierto con
        probabilidad base alta no implica capacidad predictiva. El informe final
        separa coincidencia observada de evidencia estadística.
      </p>

      <h2 className="font-semibold text-gray-900">Límites</h2>
      <ul className="list-inside list-disc space-y-1">
        <li>
          Se evalúa la afirmación, no a la persona o cuenta que la publicó.
        </li>
        <li>
          Los falsos positivos, omisiones y la probabilidad base se publican
          junto a los aciertos.
        </li>
        <li>
          Cada afirmación se conserva congelada antes de conocer el resultado.
        </li>
        <li>Este proyecto no predice sismos y no es un canal de alerta.</li>
      </ul>
    </div>
  );
}
