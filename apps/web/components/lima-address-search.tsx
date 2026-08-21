"use client";

import {
  type DistrictRiskSummary,
  type LimaRiskMatch,
  riskLevelSpec,
  romanLevel,
} from "@sismo/terrain";
import { LoaderIcon, MapPinIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Un solo campo para las dos preguntas que hace la gente: "cómo está mi
 * distrito" y "cómo está mi casa".
 *
 * Escribir el nombre de un distrito lo filtra al instante contra la lista que
 * ya viaja en la página. Escribir una dirección consulta el geocoder, que es
 * más lento, así que solo sale después de una pausa al tipear y de que el
 * texto no coincida con ningún distrito.
 */

export interface AddressHit {
  label: string;
  fullLabel: string;
  lon: number;
  lat: number;
  risk: LimaRiskMatch | null;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function LimaAddressSearch({
  districts,
  selectedDistrict,
  onSelectDistrict,
  onSelectAddress,
  activeAddress,
}: {
  districts: DistrictRiskSummary[];
  selectedDistrict: string | null;
  onSelectDistrict: (district: string | null) => void;
  onSelectAddress: (hit: AddressHit | null) => void;
  activeAddress: AddressHit | null;
}) {
  const [query, setQuery] = useState("");
  const [addressHits, setAddressHits] = useState<AddressHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const listId = useId();
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const districtHits = trimmed
    ? districts.filter((entry) =>
        normalize(entry.district).includes(normalize(trimmed)),
      )
    : [];

  /**
   * El geocoder sale solo cuando el texto no parece un distrito. Escribir
   * "surco" no debería disparar una consulta de red si la lista local ya
   * responde, y la política de uso de Nominatim pide no más de una consulta
   * por segundo: los 500 ms de pausa cubren las dos cosas.
   */
  useEffect(() => {
    if (trimmed.length < 4 || districtHits.length > 0) {
      setAddressHits([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const response = await fetch(
          `/api/v1/lima/buscar?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("búsqueda falló");
        const data = (await response.json()) as { results: AddressHit[] };
        setAddressHits(data.results ?? []);
        setSearched(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setAddressHits([]);
          setSearched(true);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [trimmed, districtHits.length]);

  const showPanel = trimmed.length >= 2;
  const activeSpec = activeAddress?.risk
    ? riskLevelSpec(activeAddress.risk.level)
    : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-gray-700" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tu distrito o tu dirección"
          aria-label="Buscar distrito o dirección en Lima"
          aria-controls={listId}
          className="w-full rounded-md border border-gray-300 bg-transparent py-2.5 pr-9 pl-9 text-gray-1000 text-sm placeholder:text-gray-700 focus:border-gray-1000 focus:outline-none"
        />
        {loading ? (
          <LoaderIcon className="-translate-y-1/2 absolute top-1/2 right-3 size-4 animate-spin text-gray-700" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setAddressHits([]);
              setSearched(false);
            }}
            aria-label="Limpiar búsqueda"
            className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-700 hover:text-gray-1000"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id={listId}
          className="overflow-hidden rounded-md border border-gray-300"
        >
          {districtHits.length > 0 ? (
            <ul>
              {districtHits.slice(0, 6).map((entry) => (
                <li key={entry.district}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAddress(null);
                      onSelectDistrict(entry.district);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100"
                  >
                    <span className="flex-1 truncate text-gray-1000">
                      {entry.district}
                    </span>
                    <span className="text-gray-800 text-xs tabular-nums">
                      {entry.pctHigh.toFixed(0)}% severo o colapso
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : addressHits.length > 0 ? (
            <ul>
              {addressHits.map((hit) => {
                const spec = hit.risk ? riskLevelSpec(hit.risk.level) : null;
                return (
                  <li key={`${hit.lon},${hit.lat}`}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDistrict(hit.risk?.district ?? null);
                        onSelectAddress(hit);
                        setQuery("");
                      }}
                      className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-100"
                    >
                      <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-gray-700" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-gray-1000 text-sm">
                          {hit.label}
                        </span>
                        <span className="block text-gray-800 text-xs">
                          {spec
                            ? `Nivel ${romanLevel(spec.level)} · ${spec.damage}`
                            : "Sin estudio publicado en ese punto"}
                        </span>
                      </span>
                      {spec ? (
                        <span
                          aria-hidden
                          className="mt-1 size-3 shrink-0 rounded-[3px]"
                          style={{ backgroundColor: spec.ui }}
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : loading ? (
            <p className="px-3 py-2.5 text-gray-800 text-sm">
              Buscando la dirección
            </p>
          ) : searched ? (
            <p className="px-3 py-2.5 text-gray-800 text-sm">
              No encontramos esa dirección. Probá con la avenida y el distrito,
              por ejemplo “Av. Pachacútec, Villa El Salvador”.
            </p>
          ) : (
            <p className="px-3 py-2.5 text-gray-800 text-sm">
              Seguí escribiendo la dirección
            </p>
          )}
        </div>
      ) : null}

      {activeAddress ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 py-2">
          <MapPinIcon className="size-3.5 shrink-0 text-gray-800" />
          <span className="min-w-0 flex-1 truncate text-gray-1000 text-sm">
            {activeAddress.label}
          </span>
          {activeSpec ? (
            <Badge
              variant="outline"
              className="gap-1.5"
              title={activeSpec.damage}
            >
              <span
                aria-hidden
                className="size-2 rounded-[2px]"
                style={{ backgroundColor: activeSpec.ui }}
              />
              Nivel {romanLevel(activeSpec.level)}
            </Badge>
          ) : (
            <Badge variant="secondary">Sin estudio</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelectAddress(null);
              onSelectDistrict(null);
            }}
          >
            Quitar
          </Button>
        </div>
      ) : selectedDistrict ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{selectedDistrict}</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectDistrict(null)}
            className="gap-1.5"
          >
            <XIcon className="size-3.5" />
            Ver toda Lima
          </Button>
        </div>
      ) : null}
    </div>
  );
}
