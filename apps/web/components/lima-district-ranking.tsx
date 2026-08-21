"use client";

import {
  type DistrictRiskSummary,
  funderLabel,
  RISK_LEVELS,
  romanLevel,
} from "@sismo/terrain";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * El ranking de distritos.
 *
 * En el PDF esta pregunta ("¿cómo está mi distrito comparado con el resto?")
 * no tiene respuesta: hay que mirar un A1 y estimar a ojo cuánta mancha roja
 * hay. Acá el porcentaje está calculado sobre las manzanas reales y la lista
 * ordenada por él.
 *
 * La fila seleccionada se sincroniza con el mapa en los dos sentidos: elegir
 * acá vuela el mapa a ese distrito, y tocar una manzana en el mapa desplaza la
 * lista hasta su fila.
 */

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

export function LimaDistrictRanking({
  districts,
  selected,
  onSelect,
}: {
  districts: DistrictRiskSummary[];
  selected: string | null;
  onSelect: (district: string | null) => void;
}) {
  const activeRef = useRef<HTMLLIElement | null>(null);

  // Cuando la selección viene del mapa, la fila puede estar fuera de vista.
  useEffect(() => {
    if (!selected || !activeRef.current) return;
    activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <ol className="divide-y divide-gray-300 overflow-hidden rounded-lg border border-gray-300">
      {districts.map((entry, index) => {
        const isOpen = selected === entry.district;
        return (
          <li
            key={entry.district}
            ref={isOpen ? activeRef : null}
            className={isOpen ? "bg-gray-100" : undefined}
          >
            <button
              type="button"
              onClick={() => onSelect(isOpen ? null : entry.district)}
              aria-expanded={isOpen}
              className="w-full px-3 py-2.5 text-left transition-colors hover:bg-gray-100"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="w-5 shrink-0 text-gray-700 text-xs tabular-nums">
                    {index + 1}
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
              <div className="border-gray-300 border-t px-3 py-3 pl-10">
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">
                    {entry.total.toLocaleString("es-PE")} manzanas
                  </Badge>
                  <Badge variant="secondary">
                    {entry.areaKm2.toFixed(1)} km²
                  </Badge>
                  <Badge variant="secondary">Estudio {entry.studyYear}</Badge>
                  <Badge variant="outline" title={funderLabel(entry.funder)}>
                    {entry.funder.replace("CISMID-", "")}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {RISK_LEVELS.map((spec, levelIndex) => {
                    const count = entry.byLevel[levelIndex] ?? 0;
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
                          {count.toLocaleString("es-PE")} ({pct.toFixed(1)}%)
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
  );
}
