import {
  evaluatePrediction,
  loadPredictionRegistry,
  windowHasClosed,
} from "@sismo/audit";
import type { PredictionVerdict } from "@sismo/contracts";
import Link from "next/link";
import { VERDICT_STYLES, VerdictBadge } from "../../components/verdict-badge";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verifica Sismos" };

export default async function VerificaPage() {
  const registry = await loadPredictionRegistry();
  const now = Date.now();

  const counts: Record<PredictionVerdict, number> = {
    PENDING: 0,
    STRICT_HIT: 0,
    NO_MATCH: 0,
    AMBIGUOUS_GEOGRAPHY: 0,
    SOURCE_DISAGREEMENT: 0,
  };
  const audits = [];
  for (const prediction of registry) {
    let verdict: PredictionVerdict = "PENDING";
    if (windowHasClosed(prediction, now)) {
      const audit = await evaluatePrediction(prediction, now).catch(() => null);
      verdict = audit?.verdict ?? "PENDING";
    }
    counts[verdict] += 1;
    audits.push({ prediction, verdict });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">Verifica Sismos</h1>
        <p className="text-sm text-gray-900">
          Afirmaciones guardadas antes de conocer el resultado. Este registro
          evalúa afirmaciones concretas contra catálogos oficiales; no ataca
          personas ni valida teorías generales.
        </p>
        <p className="mt-1 text-xs text-gray-800">
          Origen de esta tanda: Reel de Instagram DbAK4jKpyxP (cuenta
          sismos.en.peru), congelado el 20 de julio de 2026. Ventanas desde el
          20 de julio de 2026, hora de Lima.{" "}
          <Link
            href="/verifica/metodologia"
            className="text-official underline"
          >
            Metodología completa
          </Link>
        </p>
      </header>

      <div className="flex flex-wrap gap-3 text-sm" data-testid="audit-summary">
        {(Object.keys(counts) as PredictionVerdict[]).map((verdict) => (
          <span
            key={verdict}
            className={`rounded px-2 py-1 font-mono text-xs ${VERDICT_STYLES[verdict]}`}
          >
            {verdict} {counts[verdict]}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="claim-list">
          <caption className="sr-only">
            Afirmaciones congeladas con su estado actual
          </caption>
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
              <th scope="col" className="py-1.5 pr-2">
                ID
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Origen declarado
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Magnitud
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Destinos
              </th>
              <th scope="col" className="py-1.5 pr-2">
                Deadline (Lima)
              </th>
              <th scope="col" className="py-1.5">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {audits.map(({ prediction, verdict }) => (
              <tr
                key={prediction.predictionId}
                className="border-b border-gray-100"
              >
                <td className="py-1.5 pr-2">
                  <Link
                    href={`/verifica/${prediction.predictionId}`}
                    className="font-mono font-semibold text-official underline"
                  >
                    {prediction.predictionId}
                  </Link>
                </td>
                <td className="py-1.5 pr-2">{prediction.origin}</td>
                <td className="py-1.5 pr-2 font-mono">
                  {prediction.predictedMagnitudeMin}–
                  {prediction.predictedMagnitudeMax}
                </td>
                <td className="py-1.5 pr-2 text-xs">
                  {prediction.targetRegions.join(" · ")}
                </td>
                <td className="py-1.5 pr-2 font-mono text-xs">
                  {prediction.deadlineEndLima}
                </td>
                <td className="py-1.5">
                  <VerdictBadge verdict={verdict} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-800">
        <h2 className="font-semibold text-gray-900">
          ¿Quieres registrar una afirmación?
        </h2>
        <p className="mt-1">
          Una nueva afirmación entra por Pull Request o Issue con evidencia
          temporal (captura y fecha anteriores al resultado). Las modificaciones
          quedan auditadas en git.
        </p>
        <a
          href="https://github.com/crafter-station/sismo-abierto/issues/new"
          className="mt-2 inline-block text-official underline"
          rel="noreferrer"
        >
          Abrir plantilla de issue →
        </a>
      </div>
    </div>
  );
}
