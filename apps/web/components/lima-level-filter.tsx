"use client";

import { RISK_LEVELS, romanLevel } from "@sismo/terrain";
import {
  CheckIcon,
  ChevronDownIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

/**
 * Filtro de nivel, al lado del buscador.
 *
 * Antes eran cinco toggles debajo del mapa, que ocupaban una fila entera para
 * algo que la mayoría no toca. Como dropdown queda al lado del buscador, que
 * es donde la persona ya está mirando, y adentro hay espacio para el conteo y
 * el porcentaje de cada nivel sin apretar nada.
 */
export function LimaLevelFilter({
  totals,
  active,
  onChange,
}: {
  /** Conteo por nivel, índice 0 = nivel 1. */
  totals: number[];
  active: string[];
  onChange: (levels: string[]) => void;
}) {
  const grandTotal = totals.reduce((sum, count) => sum + count, 0);
  const activeSpecs = RISK_LEVELS.filter((spec) =>
    active.includes(String(spec.level)),
  );

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" />}
        className="shrink-0 gap-2"
      >
        <SlidersHorizontalIcon className="size-4 opacity-60" />
        {activeSpecs.length === 0 ? (
          <span>Todos los niveles</span>
        ) : (
          <span className="flex items-center gap-1.5">
            {activeSpecs.map((spec) => (
              <span
                key={spec.level}
                aria-hidden
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: spec.ui }}
              />
            ))}
            <span>
              {activeSpecs.length === 1
                ? `Nivel ${romanLevel(activeSpecs[0]?.level ?? 1)}`
                : `${activeSpecs.length} niveles`}
            </span>
          </span>
        )}
        <ChevronDownIcon className="size-4 opacity-60" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(21rem,calc(100vw-2rem))] p-0"
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          <p className="font-medium text-sm">Resaltar en el mapa</p>
          {active.length > 0 ? (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
            >
              Limpiar
            </button>
          ) : null}
        </div>
        <Separator />
        <ul className="p-1">
          {RISK_LEVELS.map((spec, index) => {
            const value = String(spec.level);
            const isActive = active.includes(value);
            const count = totals[index] ?? 0;
            const pct = grandTotal ? (count / grandTotal) * 100 : 0;
            return (
              <li key={spec.level}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onChange(
                      isActive
                        ? active.filter((entry) => entry !== value)
                        : [...active, value],
                    )
                  }
                  className="flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left transition-colors hover:bg-accent"
                >
                  <span
                    aria-hidden
                    className="size-3.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: spec.ui }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      {romanLevel(spec.level)} · {spec.damage}
                    </span>
                    <span className="block text-muted-foreground text-xs tabular-nums">
                      {count.toLocaleString("es-PE")} manzanas ·{" "}
                      {pct.toFixed(1)}%
                    </span>
                  </span>
                  <CheckIcon
                    className={
                      isActive
                        ? "size-4 shrink-0 opacity-100"
                        : "size-4 shrink-0 opacity-0"
                    }
                  />
                </button>
              </li>
            );
          })}
        </ul>
        <Separator />
        <p className="px-3 py-2 text-muted-foreground text-xs">
          Lo que no está resaltado sigue visible, atenuado, para no perder de
          vista dónde estás.
        </p>
      </PopoverContent>
    </Popover>
  );
}
