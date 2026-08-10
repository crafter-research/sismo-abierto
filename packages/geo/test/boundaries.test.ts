import { describe, expect, test } from "bun:test";
import { colombiaDepartamentos } from "../src/index.ts";

describe("límites administrativos de Colombia", () => {
  test("incluye 32 departamentos y Bogotá D.C.", () => {
    expect(colombiaDepartamentos.features).toHaveLength(33);
    expect(
      colombiaDepartamentos.features.map((feature) => feature.properties.name),
    ).toContain("Bogotá D.C.");
  });

  test("todas las geometrías se pueden renderizar", () => {
    for (const feature of colombiaDepartamentos.features) {
      expect(["Polygon", "MultiPolygon"]).toContain(feature.geometry.type);
      expect(feature.geometry.coordinates.length).toBeGreaterThan(0);
    }
  });
});
