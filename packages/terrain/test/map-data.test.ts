import { describe, expect, test } from "bun:test";
import {
  buildMapCollection,
  citySoilBreakdown,
  coverage,
  SOIL_COLORS,
  SOIL_LEGEND,
  soilClassOf,
} from "../src/index.ts";

describe("soilClassOf", () => {
  test("extrae la familia S1-S4 de la etiqueta larga del IGP", () => {
    expect(soilClassOf("Suelo Tipo S1 - 2: Rígido (0.2 - 0.3 seg.)")).toBe(
      "S1",
    );
    expect(soilClassOf("Suelo Tipo S2: Medianamente rígido")).toBe("S2");
    expect(soilClassOf("Suelo Tipo S3: Blando")).toBe("S3");
    expect(soilClassOf("Suelo Tipo S4 - 1: Pendiente")).toBe("S4");
  });

  test("roca es el extremo rígido, no una categoría sin clasificar", () => {
    expect(soilClassOf("Roca")).toBe("S1");
  });

  test("las zonas de amplificación tienen su propia clase", () => {
    expect(
      soilClassOf("Zona con amplificaciones máximas relativas > 2.5 veces"),
    ).toBe("amplificacion");
  });
});

describe("buildMapCollection", () => {
  const collection = buildMapCollection();

  test("clasifica todos los polígonos de la capa", () => {
    const unclassified = collection.features.filter(
      (feature) => feature.properties.suelo === "otro",
    );
    expect(unclassified).toHaveLength(0);
  });

  test("conserva un feature por polígono con geometría", () => {
    expect(collection.features.length).toBeGreaterThan(500);
    for (const feature of collection.features.slice(0, 20)) {
      expect(feature.geometry.coordinates).toBeDefined();
    }
  });

  test("recorta la precisión a ~1 metro", () => {
    const first = collection.features[0];
    const flat = JSON.stringify(first?.geometry.coordinates);
    const decimals = flat.match(/-?\d+\.(\d+)/g) ?? [];
    for (const value of decimals.slice(0, 50)) {
      const fraction = value.split(".")[1] ?? "";
      expect(fraction.length).toBeLessThanOrEqual(5);
    }
  });

  test("descarta los campos derivados del GIS de origen", () => {
    const properties = collection.features[0]?.properties as
      | Record<string, unknown>
      | undefined;
    expect(properties).toBeDefined();
    expect(properties?.st_area_sh).toBeUndefined();
    expect(properties?.st_length_).toBeUndefined();
  });

  test("declara la fecha de captura junto a los datos", () => {
    expect(collection.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(collection.sourceUrl).toContain("ide.igp.gob.pe");
  });
});

describe("citySoilBreakdown", () => {
  const breakdown = citySoilBreakdown();
  const { cities } = coverage();

  test("una entrada por cada ciudad con estudio publicado", () => {
    expect(breakdown.size).toBe(cities.length);
  });

  test("el total de una ciudad coincide con su zoneCount", () => {
    for (const city of cities.slice(0, 5)) {
      expect(breakdown.get(city.slug)?.total).toBe(city.zoneCount);
    }
  });

  test("las cuentas por clase suman el total", () => {
    for (const entry of breakdown.values()) {
      const sum = Object.values(entry.counts).reduce((a, b) => a + b, 0);
      expect(sum).toBe(entry.total);
    }
  });
});

describe("paleta", () => {
  test("cada entrada de la leyenda tiene color asignado", () => {
    for (const entry of SOIL_LEGEND) {
      expect(SOIL_COLORS[entry.soil]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test("la leyenda nombra el criterio del suelo, no un nivel de peligro", () => {
    const labels = SOIL_LEGEND.map((entry) => entry.label)
      .join(" ")
      .toLowerCase();
    expect(labels).toContain("rígido");
    expect(labels).not.toContain("peligro");
    expect(labels).not.toContain("riesgo");
  });
});
