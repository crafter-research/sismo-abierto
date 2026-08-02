import { describe, expect, test } from "bun:test";
import type { SourceStatus } from "@sismo/contracts";
import {
  renderSourceBadgeSvg,
  renderUnknownSourceBadgeSvg,
  SOURCE_BADGE_CACHE_CONTROL,
} from "../src/index.ts";

const statuses: SourceStatus[] = [
  "OPERATIONAL",
  "DEGRADED",
  "UNAVAILABLE",
  "SCHEMA_CHANGED",
  "FRESHNESS_UNKNOWN",
];

describe("badge público de fuentes", () => {
  for (const status of statuses) {
    test(`renderiza ${status} como SVG accesible`, () => {
      const svg = renderSourceBadgeSvg({
        sourceId: "igp-aceldat",
        sourceName: "IGP · ACELDAT-PERÚ",
        status,
        disclaimer:
          "Estado observado por nuestro consumidor; no representa el estado interno del IGP.",
      });

      expect(svg).toStartWith("<svg");
      expect(svg).toContain('role="img"');
      expect(svg).toContain('<title id="title">');
      expect(svg).toContain('<desc id="desc">');
      expect(svg).toContain(`data-status="${status}"`);
    });
  }

  test("escapa texto no confiable de la fuente", () => {
    const svg = renderSourceBadgeSvg({
      sourceId: "source<&",
      sourceName: 'Fuente <script> "x"',
      status: "OPERATIONAL",
      disclaimer: "A & B",
    });

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("A &amp; B");
  });

  test("renderiza fuente desconocida sin romper el formato SVG", () => {
    const svg = renderUnknownSourceBadgeSvg("no-existe");
    expect(svg).toContain('data-status="NOT_FOUND"');
    expect(svg).toContain("Fuente desconocida");
  });

  test("define caché pública corta con stale-while-revalidate", () => {
    expect(SOURCE_BADGE_CACHE_CONTROL).toContain("s-maxage=300");
    expect(SOURCE_BADGE_CACHE_CONTROL).toContain("stale-while-revalidate=3600");
  });
});
