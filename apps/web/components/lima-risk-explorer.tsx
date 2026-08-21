"use client";

import type { DistrictOutline, DistrictRiskSummary } from "@sismo/terrain";
import { useState } from "react";
import { LimaDistrictRanking } from "./lima-district-ranking";
import { LimaDistrictSearch } from "./lima-district-search";
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

  return (
    <div className="space-y-8">
      <section aria-labelledby="mapa-titulo" className="space-y-3">
        <h2 id="mapa-titulo" className="sr-only">
          Mapa interactivo
        </h2>
        <LimaDistrictSearch
          districts={districts}
          selected={selected}
          onSelect={setSelected}
        />
        <LimaRiskMap
          outlines={outlines}
          selectedDistrict={selected}
          onSelectDistrict={setSelected}
          activeLevels={activeLevels}
          onActiveLevelsChange={setActiveLevels}
        />
      </section>

      <section aria-labelledby="distritos-titulo">
        <h2
          id="distritos-titulo"
          className="mb-1 font-semibold text-gray-1000 text-lg"
        >
          Distrito por distrito
        </h2>
        <p className="mb-4 text-gray-800 text-sm">
          Ordenados por porcentaje de manzanas con daño severo o colapso
          esperado.
        </p>
        <LimaDistrictRanking
          districts={districts}
          selected={selected}
          onSelect={setSelected}
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
