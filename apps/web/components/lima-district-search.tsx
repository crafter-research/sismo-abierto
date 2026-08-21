"use client";

import type { DistrictRiskSummary } from "@sismo/terrain";
import { CheckIcon, MapPinIcon, SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Buscador de distrito. Es la entrada principal a la página: la pregunta real
 * de una persona es "cómo está el mío", y en el PDF esa pregunta no tiene
 * respuesta salvo mirar un plano A1 y estimar a ojo.
 *
 * `cmdk` filtra sin tildes por su cuenta, pero el `value` de cada item lleva
 * el nombre normalizado igual para que "san isidro" encuentre "San Isidro" en
 * cualquier orden de tipeo.
 */

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function LimaDistrictSearch({
  districts,
  selected,
  onSelect,
}: {
  districts: DistrictRiskSummary[];
  selected: string | null;
  onSelect: (district: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = districts.find((entry) => entry.district === selected);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="outline" />}
          aria-expanded={open}
          className="w-full justify-start gap-2 sm:w-72"
        >
          <SearchIcon className="size-4 shrink-0 opacity-60" />
          {active ? (
            <span className="truncate">{active.district}</span>
          ) : (
            <span className="text-muted-foreground">Buscá tu distrito</span>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(20rem,calc(100vw-2rem))] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Escribí el nombre" />
            <CommandList>
              <CommandEmpty>
                Ese distrito no tiene estudio publicado.
              </CommandEmpty>
              <CommandGroup>
                {districts.map((entry) => (
                  <CommandItem
                    key={entry.district}
                    value={`${entry.district} ${normalize(entry.district)}`}
                    onSelect={() => {
                      onSelect(
                        entry.district === selected ? null : entry.district,
                      );
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={
                        entry.district === selected
                          ? "size-4 opacity-100"
                          : "size-4 opacity-0"
                      }
                    />
                    <span className="flex-1 truncate">{entry.district}</span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {entry.pctHigh.toFixed(0)}%
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {active ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelect(null)}
          className="gap-1.5"
        >
          <XIcon className="size-3.5" />
          Ver toda Lima
        </Button>
      ) : (
        <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <MapPinIcon className="size-3.5" />o tocá cualquier manzana del mapa
        </p>
      )}
    </div>
  );
}
