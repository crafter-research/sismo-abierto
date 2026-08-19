import { describe, expect, test } from "bun:test";
import {
  coverage,
  NO_STUDY_LABEL,
  TERRAIN_PROVENANCE,
  zoneAt,
} from "../src/index.ts";

describe("zoneAt", () => {
  test("estación PAIA (Paita) cae en suelo blando S3", () => {
    const zone = zoneAt(-81.093, -5.092);
    expect(zone).not.toBeNull();
    expect(zone?.city).toBe("Paita");
    expect(zone?.zone).toBe("Suelo Tipo S3: Blando");
  });

  test("estaciones SCPIU y UDEP (Piura) caen en suelo medianamente rígido S2", () => {
    // Coordenadas de ACELDAT, evento 20260556 (2026-08-15, M4.5)
    const stations = [
      { code: "SCPIU", lon: -80.641, lat: -5.194 },
      { code: "UDEP", lon: -80.639, lat: -5.17 },
    ];
    for (const station of stations) {
      const zone = zoneAt(station.lon, station.lat);
      expect(zone?.zone).toBe("Suelo Tipo S2: Medianamente rígido");
    }
  });

  test("estaciones del mismo evento fuera de cobertura no reciben zona inventada", () => {
    // HNAL, CHYA, SNIG, GYAO del evento 20260556: sin estudio publicado
    const uncovered = [
      { code: "HNAL", lon: -79.864, lat: -4.836 },
      { code: "CHYA", lon: -79.856, lat: -6.771 },
      { code: "SNIG", lon: -79.012, lat: -5.125 },
      { code: "GYAO", lon: -78.876, lat: -6.599 },
    ];
    for (const station of uncovered) {
      expect(zoneAt(station.lon, station.lat)).toBeNull();
    }
  });

  test("un punto sin estudio publicado devuelve null, no una zona vacía", () => {
    expect(zoneAt(-70.0, -12.0)).toBeNull();
  });

  test("una zona encontrada viaja con su disclaimer y su procedencia", () => {
    const zone = zoneAt(-81.093, -5.092);
    expect(zone?.disclaimer).toContain("no la seguridad de una edificación");
    expect(zone?.provenance.sourceUrl).toContain("ide.igp.gob.pe");
    expect(zone?.provenance.provider).toBe("Instituto Geofísico del Perú");
  });
});

describe("coverage", () => {
  test("declara las ciudades y departamentos con estudio publicado", () => {
    const result = coverage();
    expect(result.featureCount).toBe(TERRAIN_PROVENANCE.featureCount);
    expect(result.cities.length).toBeGreaterThan(0);
    expect(result.departments).toContain("PIURA");
    expect(result.cities.map((c) => c.city)).toContain("Paita");
  });

  test("no inventa cobertura fuera del snapshot", () => {
    expect(coverage().cities.map((c) => c.city)).not.toContain("Iquitos");
  });
});

describe("ausencia de estudio", () => {
  test("hay una etiqueta explícita, distinta de un tipo de suelo", () => {
    expect(NO_STUDY_LABEL).toBe("sin estudio de zonificación publicado");
  });
});
