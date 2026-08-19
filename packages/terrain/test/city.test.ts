import { describe, expect, test } from "bun:test";
import { citySlug, cityTerrain, coverage } from "../src/index.ts";

describe("citySlug", () => {
  test("normaliza tildes y eñes", () => {
    expect(citySlug("Cañete")).toBe("canete");
    expect(citySlug("Acarí")).toBe("acari");
    expect(citySlug("Alto Alianza")).toBe("alto-alianza");
  });

  test("es estable para el mismo nombre", () => {
    expect(citySlug("Paita")).toBe(citySlug("paita"));
  });
});

describe("coverage", () => {
  test("cada ciudad trae su slug de ruta", () => {
    const paita = coverage().cities.find((c) => c.city === "Paita");
    expect(paita?.slug).toBe("paita");
  });

  test("no hay slugs duplicados dentro de un mismo departamento", () => {
    const seen = new Set<string>();
    for (const city of coverage().cities) {
      const key = `${city.department}::${city.slug}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe("cityTerrain", () => {
  test("Paita publica su zona de suelo blando", () => {
    const terrain = cityTerrain("paita");
    expect(terrain?.city).toBe("Paita");
    expect(terrain?.department).toBe("PIURA");
    expect(terrain?.zones.map((z) => z.zone)).toContain(
      "Suelo Tipo S3: Blando",
    );
  });

  test("cada zona declara cuántos polígonos la componen", () => {
    const terrain = cityTerrain("paita");
    for (const zone of terrain?.zones ?? []) {
      expect(zone.polygonCount).toBeGreaterThan(0);
    }
  });

  test("una ciudad sin estudio devuelve null", () => {
    expect(cityTerrain("iquitos")).toBeNull();
  });

  test("la ciudad viaja con disclaimer y procedencia", () => {
    const terrain = cityTerrain("paita");
    expect(terrain?.disclaimer).toContain("no la seguridad de una edificación");
    expect(terrain?.provenance.provider).toBe("Instituto Geofísico del Perú");
  });
});
