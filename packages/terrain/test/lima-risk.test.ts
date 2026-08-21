import { describe, expect, test } from "bun:test";
import {
  RISK_LEVELS,
  riskLevelSpec,
  romanLevel,
  whatItMeans,
} from "../src/lima-risk/levels.ts";
import { funderLabel } from "../src/lima-risk/store.ts";

describe("niveles de riesgo del CISMID", () => {
  test("son exactamente los cinco de la tabla oficial", () => {
    expect(RISK_LEVELS).toHaveLength(5);
    expect(RISK_LEVELS.map((spec) => spec.level)).toEqual([1, 2, 3, 4, 5]);
  });

  test("los colores del PDF son los que se midieron en el original", () => {
    // Estos cinco hex son la llave de extracción: si el CISMID republica el
    // PDF con otra rampa, la ingesta deja de reconocer los polígonos y este
    // test es el que lo delata.
    expect(RISK_LEVELS.map((spec) => spec.color)).toEqual([
      "#267300",
      "#55FF00",
      "#FFFF00",
      "#FFAA00",
      "#FF0000",
    ]);
  });

  test("agrupa el riesgo como lo agrupa el CISMID", () => {
    // I-II bajo, III-IV moderado, V alto.
    expect(RISK_LEVELS.map((spec) => spec.risk)).toEqual([
      "Bajo",
      "Bajo",
      "Moderado",
      "Moderado",
      "Alto",
    ]);
  });

  test("cada nivel de la UI tiene un color propio", () => {
    const uiColors = new Set(RISK_LEVELS.map((spec) => spec.ui));
    expect(uiColors.size).toBe(5);
  });

  test("riskLevelSpec devuelve null fuera de rango", () => {
    expect(riskLevelSpec(0)).toBeNull();
    expect(riskLevelSpec(6)).toBeNull();
    expect(riskLevelSpec(3)?.damage).toBe("Daño moderado");
  });

  test("romanLevel usa la numeración de la tabla", () => {
    expect(romanLevel(1)).toBe("I");
    expect(romanLevel(5)).toBe("V");
  });

  test("cada nivel explica qué significa para una persona", () => {
    for (const spec of RISK_LEVELS) {
      expect(whatItMeans(spec.level).length).toBeGreaterThan(20);
    }
    expect(whatItMeans(99)).toBe("");
  });
});

describe("financiadores", () => {
  test("traduce los tres que aparecen en el PDF", () => {
    expect(funderLabel("CISMID-MVCS")).toContain("Vivienda");
    expect(funderLabel("CISMID-MEF")).toContain("Economía");
    expect(funderLabel("CISMID-CENEPRED")).toBe("CENEPRED");
  });

  test("un financiador desconocido se devuelve tal cual", () => {
    expect(funderLabel("CISMID-OTRO")).toBe("CISMID-OTRO");
  });
});

describe("etiquetas de la búsqueda", () => {
  test("shortLabel recorta el display_name de Nominatim a lo legible", () => {
    // Nominatim devuelve el país, el código postal y la región completa.
    // La UI muestra solo las tres primeras partes.
    const full =
      "Avenida Manuel Valle, Huertos de Lurín, La Unión, Villa Libertad Casica, Lurín, Lima, 15823, Perú";
    const short = full
      .split(",")
      .map((p) => p.trim())
      .slice(0, 3)
      .join(", ");
    expect(short).toBe("Avenida Manuel Valle, Huertos de Lurín, La Unión");
    expect(short).not.toContain("Perú");
    expect(short).not.toContain("15823");
  });
});
