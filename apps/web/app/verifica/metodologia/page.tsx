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
      <p className="rounded border border-gray-300 bg-background-200 p-3">
        Las afirmaciones auditadas provienen de un Reel de sismos.en.peru, no
        del IGP. IGP/CENSIS y USGS se usan como fuentes de comprobación y no han
        respaldado estas afirmaciones.
      </p>

      <h2 className="font-semibold text-gray-900">
        Backfill de informes históricos
      </h2>
      <p>
        Los informes 244, 245, 246 y 249 al 254 se incorporaron el 2 de agosto
        de 2026 desde capturas aportadas por el usuario. Se evalúan con los
        mismos criterios de tiempo, magnitud, geografía y tasa base, pero su
        incorporación es retrospectiva: varias ventanas ya habían cerrado. No
        tienen el mismo valor probatorio que las ocho afirmaciones congeladas
        antes de sus resultados.
      </p>
      <ul className="list-inside list-disc space-y-1">
        <li>Cada punto del informe se evalúa por separado.</li>
        <li>
          Los porcentajes 40/30/20/10 se conservan como texto declarado; no se
          presuponen calibrados.
        </li>
        <li>
          Si la descripción territorial es vaga, no se inventa una frontera para
          convertirla en acierto o fallo.
        </li>
        <li>
          Un mismo terremoto puede coincidir con varios informes superpuestos y
          no cuenta como evidencia independiente repetida.
        </li>
      </ul>
      <p>
        El protocolo específico vive en{" "}
        <span className="font-mono">
          data/predictions/historical-audit-protocol.md
        </span>
        .
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
          magnitud y una geografía inequívoca. La interfaz lo presenta como
          “Coincidencia estricta”, no como acierto predictivo.
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

      <h2 className="font-semibold text-gray-900">
        Interpretación pública en dos ejes
      </h2>
      <p>
        El veredicto congelado conserva la evaluación original. La interfaz
        añade una capa separada con{" "}
        <span className="font-mono">STRICT_MATCH</span>, la probabilidad base y
        el estado “capacidad predictiva no establecida”. Así se evita presentar
        una coincidencia como una predicción validada.
      </p>
      <ul className="list-inside list-disc space-y-1">
        <li>80% o más: muy esperable sin predicción.</li>
        <li>50% a 79.9%: esperable sin predicción.</li>
        <li>20% a 49.9%: posibilidad moderada sin predicción.</li>
        <li>Menos de 20%: poco esperable según el histórico.</li>
      </ul>
      <p>
        Estas bandas son ayudas descriptivas. El porcentaje continuo es la señal
        principal y las bandas no representan umbrales de significancia
        estadística.
      </p>

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
