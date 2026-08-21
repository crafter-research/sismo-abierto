import {
  type CitySoilBreakdown,
  SOIL_COLORS,
  SOIL_LEGEND,
} from "@sismo/terrain";

/**
 * Barra de color de una ciudad: cuánto del suelo estudiado cae en cada clase
 * S1-S4/amplificación, en el orden de la leyenda oficial (rígido → flexible).
 * Los anchos son la proporción real de polígonos por clase, no un valor
 * decorativo — dos ciudades con el mismo `zoneCount` pueden tener una barra
 * completamente distinta si su mezcla de suelo difiere.
 */
export function SoilBreakdownBar({
  breakdown,
}: {
  breakdown: CitySoilBreakdown;
}) {
  if (breakdown.total === 0) return null;

  return (
    <span
      className="inline-flex h-2 w-16 overflow-hidden rounded-sm align-middle"
      title={SOIL_LEGEND.map(
        (entry) => `${entry.label}: ${breakdown.counts[entry.soil] ?? 0}`,
      ).join(" · ")}
    >
      {SOIL_LEGEND.map((entry) => {
        const count = breakdown.counts[entry.soil] ?? 0;
        if (count === 0) return null;
        const width = (count / breakdown.total) * 100;
        return (
          <span
            key={entry.soil}
            style={{
              width: `${width}%`,
              backgroundColor: SOIL_COLORS[entry.soil],
            }}
          />
        );
      })}
    </span>
  );
}
