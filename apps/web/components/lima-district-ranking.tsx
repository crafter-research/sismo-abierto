"use client";

import {
  type DistrictRiskSummary,
  funderLabel,
  RISK_LEVELS,
  romanLevel,
} from "@sismo/terrain";
import { useMemo, useState } from "react";

/**
 * El ranking de distritos, buscable.
 *
 * En el PDF esta pregunta ("¿cómo está mi distrito comparado con el resto?")
 * no tiene respuesta: hay que mirar un A1 y estimar a ojo cuánta mancha roja
 * hay. Acá el porcentaje está calculado sobre las manzanas reales y la lista
 * ordenada por él.
 */

/** Normaliza para buscar sin tildes: "san isidro" encuentra "San Isidro". */
function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function DistributionBar({ summary }: { summary: DistrictRiskSummary }) {
  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full"
      role="img"
      aria-label={`Distribución de niveles en ${summary.district}`}
    >
      {RISK_LEVELS.map((spec, index) => {
        const count = summary.byLevel[index] ?? 0;
        const pct = summary.total ? (count / summary.total) * 100 : 0;
        if (pct <= 0) return null;
        return (
          <div
            key={spec.level}
            style={{ width: `${pct}%`, backgroundColor: spec.ui }}
            title={`Nivel ${romanLevel(spec.level)}: ${count.toLocaleString("es-PE")} manzanas (${pct.toFixed(1)}%)`}
          />
        );
      })}
    </div>
  );
}

export function DistrictRanking({
  districts,
}: {
  districts: DistrictRiskSummary[];
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return districts;
    return districts.filter((entry) => normalize(entry.district).includes(q));
  }, [districts, query]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">Buscar distrito</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscá tu distrito"
          className="mb-3 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-gray-1000 text-sm placeholder:text-gray-700 focus:border-gray-1000 focus:outline-none"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="rounded-md border border-gray-300 border-dashed p-4 text-center text-gray-800 text-sm">
          Ningún distrito coincide con “{query}”. El estudio cubre{" "}
          {districts.length} distritos de Lima y Callao; puede que el tuyo
          todavía no tenga estudio publicado.
        </p>
      ) : (
        <ol className="divide-y divide-gray-300 overflow-hidden rounded-lg border border-gray-300">
          {filtered.map((entry) => {
            const isOpen = expanded === entry.district;
            const rank = districts.indexOf(entry) + 1;
            return (
              <li key={entry.district}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : entry.district)}
                  aria-expanded={isOpen}
                  className="w-full px-3 py-2.5 text-left transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="w-5 shrink-0 text-gray-700 text-xs tabular-nums">
                        {rank}
                      </span>
                      <span className="truncate font-medium text-gray-1000 text-sm">
                        {entry.district}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-sm tabular-nums">
                      {entry.pctHigh.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 pl-7">
                    <DistributionBar summary={entry} />
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-gray-300 border-t bg-gray-100 px-3 py-3 pl-10">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                      <div>
                        <dt className="text-gray-800">Manzanas</dt>
                        <dd className="font-medium text-gray-1000">
                          {entry.total.toLocaleString("es-PE")}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-800">Superficie</dt>
                        <dd className="font-medium text-gray-1000">
                          {entry.areaKm2.toFixed(1)} km²
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-800">Año del estudio</dt>
                        <dd className="font-medium text-gray-1000">
                          {entry.studyYear}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-800">Financiado por</dt>
                        <dd
                          className="truncate font-medium text-gray-1000"
                          title={funderLabel(entry.funder)}
                        >
                          {entry.funder.replace("CISMID-", "")}
                        </dd>
                      </div>
                    </dl>
                    <ul className="mt-3 space-y-1">
                      {RISK_LEVELS.map((spec, index) => {
                        const count = entry.byLevel[index] ?? 0;
                        if (count === 0) return null;
                        const pct = (count / entry.total) * 100;
                        return (
                          <li
                            key={spec.level}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span
                              aria-hidden
                              className="size-2.5 shrink-0 rounded-[2px]"
                              style={{ backgroundColor: spec.ui }}
                            />
                            <span className="text-gray-900">
                              {romanLevel(spec.level)} · {spec.damage}
                            </span>
                            <span className="ml-auto text-gray-800 tabular-nums">
                              {count.toLocaleString("es-PE")} ({pct.toFixed(1)}
                              %)
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
