import { describe, expect, test } from "bun:test";
import {
  computePga,
  parseAceldatFile,
  peakAbsolute,
  reduceForView,
} from "../src/index.ts";
import expected from "./fixtures/schyo-stripped.expected.json";

const fixtureText = await Bun.file(
  new URL("./fixtures/schyo-stripped.txt", import.meta.url).pathname,
).text();

describe("parseAceldatFile", () => {
  const parsed = parseAceldatFile(fixtureText);

  test("extrae el header oficial completo", () => {
    expect(parsed.header.stationCode).toBe("SCHYO");
    expect(parsed.header.stationName).toContain("SENCICO");
    expect(parsed.header.sampleRateHz).toBe(200);
    expect(parsed.header.units).toBe("cm/s2");
    expect(parsed.header.baselineCorrected).toBe(true);
    expect(parsed.header.eventMagnitude).toBe(5.1);
    expect(parsed.header.eventDepthKm).toBe(24);
    expect(parsed.header.epicentralDistanceKm).toBe(9.7);
    expect(parsed.header.startTimeUtc).toBe("2026/07/19 02:24:33 UTC");
    expect(parsed.header.pga).toEqual({ z: 43.7949, n: 64.7735, e: 53.1026 });
  });

  test("lee todas las muestras del fixture", () => {
    expect(parsed.components.z.length).toBe(expected.sampleLines);
    expect(parsed.components.n.length).toBe(expected.sampleLines);
    expect(parsed.components.e.length).toBe(expected.sampleLines);
    expect(parsed.header.sampleCount).toBe(expected.sampleLines);
  });

  test("las métricas se calculan sobre la serie completa y coinciden con el PGA oficial", () => {
    const pga = computePga(parsed.components);
    expect(pga.z).toBeCloseTo(expected.pga.z, 6);
    expect(pga.n).toBeCloseTo(expected.pga.n, 6);
    expect(pga.e).toBeCloseTo(expected.pga.e, 6);
    expect(pga.z).toBeCloseTo(parsed.header.pga.z, 3);
    expect(pga.n).toBeCloseTo(parsed.header.pga.n, 3);
    expect(pga.e).toBeCloseTo(parsed.header.pga.e, 3);
  });

  test("la reducción visual no altera el pico", () => {
    const reduced = reduceForView(parsed.components.n, 400);
    expect(reduced.length).toBeLessThanOrEqual(800);
    expect(peakAbsolute(reduced)).toBeCloseTo(
      peakAbsolute(parsed.components.n),
      9,
    );
  });

  test("archivo sin header institucional falla con error tipado", () => {
    expect(() => parseAceldatFile("garbage")).toThrow(
      "encabezado institucional",
    );
  });

  test("línea de datos corrupta falla en vez de devolver datos vacíos", () => {
    const corrupted = fixtureText.replace(
      /^(\s+-?[\d.]+\s+-?[\d.]+\s+)-?[\d.]+$/m,
      "$1abc",
    );
    expect(() => parseAceldatFile(corrupted)).toThrow();
  });
});
