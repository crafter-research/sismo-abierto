"use client";

import type { DistrictOutline, DistrictRiskSummary } from "@sismo/terrain";
import { useCallback, useRef, useState } from "react";
import { type AddressHit, LimaAddressSearch } from "./lima-address-search";
import { LimaDistrictRanking } from "./lima-district-ranking";
import { LimaLevelLegend } from "./lima-level-legend";
import { LimaRiskMap } from "./lima-risk-map";

/**
 * Une buscador, mapa, ranking y leyenda en un solo estado.
 *
 * El punto de la página es responder "cómo está mi distrito", y esa pregunta
 * se hace de tres maneras según la persona: escribiendo el nombre, tocando el
 * mapa, o recorriendo la lista. Las tres tienen que llevar al mismo lugar, así
 * que el distrito seleccionado vive acá arriba y los hijos lo comparten.
 *
 * Lo mismo con el nivel: la leyenda de abajo y los toggles del mapa son el
 * mismo filtro visto desde dos lugares de la página.
 */
export function LimaRiskExplorer({
  districts,
  outlines,
  levelTotals,
}: {
  districts: DistrictRiskSummary[];
  outlines: DistrictOutline[];
  levelTotals: number[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeLevels, setActiveLevels] = useState<string[]>([]);
  const [address, setAddress] = useState<AddressHit | null>(null);
  // Ver `FlyTo` en el mapa: solo una elección explícita mueve la cámara.
  const [flyToken, setFlyToken] = useState(0);
  const requestFly = useCallback(() => setFlyToken((n) => n + 1), []);
  const mapRef = useRef<HTMLDivElement | null>(null);

  /**
   * Elegir un distrito desde la lista trae la vista al mapa, no al revés.
   * El mapa es lo que responde la pregunta; la lista es el índice. Llevar la
   * lista hasta la fila (que es lo que hacía antes) desplazaba media pantalla
   * para mostrar el elemento en el que la persona acababa de hacer click.
   */
  const selectFromList = useCallback(
    (district: string | null) => {
      setSelected(district);
      // Elegir un distrito descarta la dirección: el mapa no puede estar
      // encuadrado en una cuadra y en un distrito entero al mismo tiempo.
      setAddress(null);
      requestFly();
      if (!district) return;
      mapRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [requestFly],
  );

  /** Desde el buscador: elegir distrito o dirección sí mueve la cámara. */
  const selectDistrictFromSearch = useCallback(
    (district: string | null) => {
      setSelected(district);
      requestFly();
    },
    [requestFly],
  );

  const selectAddress = useCallback(
    (hit: AddressHit | null) => {
      setAddress(hit);
      requestFly();
    },
    [requestFly],
  );

  return (
    <div className="space-y-8">
      <section
        ref={mapRef}
        aria-labelledby="mapa-titulo"
        className="scroll-mt-4 space-y-3"
      >
        <h2 id="mapa-titulo" className="sr-only">
          Mapa interactivo
        </h2>
        <LimaAddressSearch
          districts={districts}
          selectedDistrict={selected}
          onSelectDistrict={selectDistrictFromSearch}
          onSelectAddress={selectAddress}
          activeAddress={address}
        />
        <LimaRiskMap
          outlines={outlines}
          selectedDistrict={selected}
          onSelectDistrict={setSelected}
          activeLevels={activeLevels}
          onActiveLevelsChange={setActiveLevels}
          levelTotals={levelTotals}
          address={address}
          flyToken={flyToken}
        />
      </section>

      <section aria-labelledby="distritos-titulo">
        <h2
          id="distritos-titulo"
          className="mb-3 font-semibold text-gray-1000 text-lg"
        >
          Distrito por distrito
        </h2>
        <LimaDistrictRanking
          districts={districts}
          selected={selected}
          onSelect={selectFromList}
        />
      </section>

      <section aria-labelledby="leyenda-titulo">
        <h2 id="leyenda-titulo" className="sr-only">
          Los cinco niveles de daño
        </h2>
        <LimaLevelLegend
          totals={levelTotals}
          active={activeLevels}
          onToggle={setActiveLevels}
        />
      </section>
    </div>
  );
}
