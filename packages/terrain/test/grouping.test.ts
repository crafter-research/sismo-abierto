import { describe, expect, test } from "bun:test";
import { groupStationsByZone, NO_STUDY_LABEL } from "../src/index.ts";

// Estaciones reales del evento ACELDAT ran-20260556 (2026-08-15, M4.5)
const stations = [
  { code: "PAIA", name: "Paita, Piura", longitude: -81.093, latitude: -5.092 },
  {
    code: "SCPIU",
    name: "SENCICO, Piura",
    longitude: -80.641,
    latitude: -5.194,
  },
  {
    code: "UDEP",
    name: "Universidad De Piura",
    longitude: -80.639,
    latitude: -5.17,
  },
  {
    code: "CHYA",
    name: "Chiclayo, Lambayeque",
    longitude: -79.856,
    latitude: -6.771,
  },
];

describe("groupStationsByZone", () => {
  test("agrupa las dos estaciones de Piura bajo la misma zona S2", () => {
    const { groups } = groupStationsByZone(stations);
    const s2 = groups.find((g) => g.label.includes("S2"));
    expect(s2?.stations.map((s) => s.station.code).sort()).toEqual([
      "SCPIU",
      "UDEP",
    ]);
  });

  test("separa PAIA en su propia zona S3", () => {
    const { groups } = groupStationsByZone(stations);
    const s3 = groups.find((g) => g.label.includes("S3"));
    expect(s3?.stations).toHaveLength(1);
    expect(s3?.stations[0]?.station.code).toBe("PAIA");
  });

  test("cuenta cubiertas y sin estudio por separado", () => {
    const { coveredCount, uncoveredCount } = groupStationsByZone(stations);
    expect(coveredCount).toBe(3);
    expect(uncoveredCount).toBe(1);
  });

  test("el grupo sin estudio va último y tiene zone null", () => {
    const { groups } = groupStationsByZone(stations);
    const last = groups.at(-1);
    expect(last?.label).toBe(NO_STUDY_LABEL);
    expect(last?.zone).toBeNull();
    expect(last?.stations[0]?.station.code).toBe("CHYA");
  });

  test("adjunta el PGA pico que le entregue quien llama", () => {
    const peaks: Record<string, number> = {
      PAIA: 0.7649,
      SCPIU: 0.919,
      UDEP: 0.7248,
      CHYA: 0.1961,
    };
    const { groups } = groupStationsByZone(
      stations,
      (station) => peaks[station.code] ?? null,
    );
    const s3 = groups.find((g) => g.label.includes("S3"));
    expect(s3?.stations[0]?.peakPga).toBe(0.7649);
  });

  test("sin lista de estaciones no inventa grupos", () => {
    const result = groupStationsByZone([]);
    expect(result.groups).toEqual([]);
    expect(result.coveredCount).toBe(0);
    expect(result.uncoveredCount).toBe(0);
  });
});
