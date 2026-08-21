import { describe, expect, test } from "bun:test";
import {
  categorizeGeomorph,
  GEOMORPH_COLORS,
  GEOMORPH_LEGEND,
} from "../src/geomorphology.ts";

describe("categorizeGeomorph", () => {
  test("agrupa vertientes y piedemontes, la subunidad mas comun (21,985 features medidos)", () => {
    expect(categorizeGeomorph("Vertiente o piedemonte coluvio-deluvial")).toBe(
      "vertiente",
    );
    expect(categorizeGeomorph("Ladera de montaña en roca sedimentaria")).toBe(
      "vertiente",
    );
  });

  test("prioriza volcanico sobre montana cuando la roca es volcanica", () => {
    expect(categorizeGeomorph("Montaña en roca volcánica")).toBe("volcanico");
    expect(categorizeGeomorph("Montaña en roca intrusiva")).toBe("montana");
  });

  test("agrupa cuerpos de agua y humedales", () => {
    expect(categorizeGeomorph("Laguna y cuerpos de agua")).toBe("agua");
    expect(categorizeGeomorph("Bofedales")).toBe("agua");
    expect(categorizeGeomorph("Meandro abandonado")).toBe("agua");
  });

  test("agrupa glaciares y morrenas antes que agua", () => {
    expect(categorizeGeomorph("Valle glaciar con laguna")).toBe("glaciar");
    expect(categorizeGeomorph("Morrenas")).toBe("glaciar");
  });

  test("agrupa litoral, incluidos mantos y barras de arena", () => {
    expect(categorizeGeomorph("Mantos de arena")).toBe("litoral");
    expect(categorizeGeomorph("Barra de arena en cauce de río")).toBe(
      "litoral",
    );
    expect(categorizeGeomorph("Terraza marina")).toBe("litoral");
  });

  test("agrupa actividad antropica, incluida mineria", () => {
    expect(categorizeGeomorph("Actividad minera")).toBe("antropico");
    expect(categorizeGeomorph("Depósito antrópico")).toBe("antropico");
  });

  test("cae a otro solo para subunidades sin patron reconocido", () => {
    expect(categorizeGeomorph("Isla")).toBe("otro");
    expect(categorizeGeomorph(null)).toBe("otro");
    expect(categorizeGeomorph(undefined)).toBe("otro");
  });

  test("GEOMORPH_COLORS y GEOMORPH_LEGEND cubren las mismas categorias", () => {
    const legendCategories: string[] = GEOMORPH_LEGEND.map(
      (entry) => entry.category,
    );
    const colorCategories = Object.keys(GEOMORPH_COLORS);
    expect(legendCategories.sort()).toEqual(colorCategories.sort());
  });
});
