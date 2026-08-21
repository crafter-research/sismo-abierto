"use client";

import { RISK_LEVELS, romanLevel, whatItMeans } from "@sismo/terrain";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * La leyenda, que además filtra.
 *
 * En el PDF la leyenda es un recuadro impreso al costado del plano: la mirás,
 * memorizás el color y volvés al mapa. Acá cada nivel es un control: tocarlo
 * resalta esas manzanas en el mapa y atenúa el resto, así que la leyenda deja
 * de ser una nota al pie y pasa a ser la forma de leer el mapa.
 */
export function LimaLevelLegend({
  totals,
  active,
  onToggle,
}: {
  /** Conteo por nivel, índice 0 = nivel 1. */
  totals: number[];
  active: string[];
  onToggle: (levels: string[]) => void;
}) {
  const grandTotal = totals.reduce((sum, count) => sum + count, 0);

  return (
    <div className="rounded-lg border border-gray-300">
      <div className="flex flex-wrap items-baseline justify-between gap-2 p-4 pb-3">
        <h2 className="font-semibold text-base text-gray-1000">
          Los cinco niveles
        </h2>
        {active.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggle([])}
            className="text-gray-800 text-xs underline underline-offset-2 hover:text-gray-1000"
          >
            Quitar filtro
          </button>
        ) : (
          <p className="text-gray-700 text-xs">
            Tocá un nivel para resaltarlo en el mapa
          </p>
        )}
      </div>
      <Separator />
      <ul>
        {RISK_LEVELS.map((spec, index) => {
          const count = totals[index] ?? 0;
          const pct = grandTotal ? (count / grandTotal) * 100 : 0;
          const isActive = active.includes(String(spec.level));
          return (
            <li
              key={spec.level}
              className="border-gray-300 border-b last:border-b-0"
            >
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  onToggle(
                    isActive
                      ? active.filter((value) => value !== String(spec.level))
                      : [...active, String(spec.level)],
                  )
                }
                className={`flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-gray-100 ${
                  isActive ? "bg-gray-100" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 rounded-[3px] ring-offset-2 ring-offset-background-100"
                  style={{
                    backgroundColor: spec.ui,
                    boxShadow: isActive ? `0 0 0 2px ${spec.ui}` : undefined,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-gray-1000 text-sm">
                      Nivel {romanLevel(spec.level)} · {spec.damage}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Riesgo {spec.risk.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-gray-800 text-xs leading-relaxed">
                    {whatItMeans(spec.level)}
                  </p>
                  <p className="mt-1 text-gray-700 text-xs">
                    Reparar cuesta {spec.repairCost} del valor de la vivienda
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-gray-1000 text-sm tabular-nums">
                    {pct.toFixed(1)}%
                  </p>
                  <p className="text-gray-700 text-xs tabular-nums">
                    {count.toLocaleString("es-PE")}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
