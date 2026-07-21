import { describe, expect, test } from "bun:test";
import { slugifyVolcano } from "@sismo/data";
import { explanationForLevel, LEVEL_EXPLANATIONS } from "../src/index.ts";

const fixturePath = new URL(
  "../../data/test/fixtures/volcano-wfs.json",
  import.meta.url,
).pathname;

describe("frescura y normalización volcánica", () => {
  test("la respuesta real trae 16 volcanes sin ningún campo de fecha", async () => {
    const data = (await Bun.file(fixturePath).json()) as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    expect(data.features.length).toBe(16);
    for (const feature of data.features) {
      const keys = Object.keys(feature.properties);
      expect(keys.some((key) => /fecha|date|time|updated/i.test(key))).toBe(
        false,
      );
      expect(typeof feature.properties.nivel).toBe("string");
      expect(typeof feature.properties.volcan).toBe("string");
    }
  });

  test("los slugs son únicos y estables", async () => {
    const data = (await Bun.file(fixturePath).json()) as {
      features: Array<{ properties: { volcan: string } }>;
    };
    const slugs = data.features.map((feature) =>
      slugifyVolcano(feature.properties.volcan),
    );
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("sabancaya");
    expect(slugs).toContain("misti");
  });

  test("slugify normaliza tildes y espacios", () => {
    expect(slugifyVolcano("Cerro Auquihuato")).toBe("cerro-auquihuato");
    expect(slugifyVolcano("Huaynaputina")).toBe("huaynaputina");
  });

  test("explicaciones cubren la semaforización y responden por nivel", () => {
    expect(LEVEL_EXPLANATIONS.map((entry) => entry.level)).toEqual([
      "Verde",
      "Amarillo",
      "Naranja",
      "Rojo",
    ]);
    expect(explanationForLevel("naranja")?.level).toBe("Naranja");
    expect(explanationForLevel("  Verde ")?.level).toBe("Verde");
    expect(explanationForLevel("Morado")).toBeNull();
  });
});
