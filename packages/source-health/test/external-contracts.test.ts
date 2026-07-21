import { describe, expect, test } from "bun:test";
import { parseXlsxRows } from "@sismo/data";
import { checkCensisHeader, checkExternalContract } from "../src/index.ts";

const fixture = (name: string) =>
  new URL(`../../data/test/fixtures/${name}`, import.meta.url).pathname;

describe("linter de contratos externos: respuestas reales pasan", () => {
  test("ArcGIS último sismo", async () => {
    const result = checkExternalContract(
      "arcgis-latest",
      await Bun.file(fixture("arcgis-latest.json")).json(),
    );
    expect(result.valid).toBe(true);
    expect(result.recordCount).toBe(1);
    expect(result.drift).toEqual([]);
  });

  test("WFS último sismo", async () => {
    const result = checkExternalContract(
      "wfs-latest",
      await Bun.file(fixture("wfs-latest.json")).json(),
    );
    expect(result.valid).toBe(true);
  });

  test("WFS volcanes (16 registros, llaves exactas)", async () => {
    const result = checkExternalContract(
      "volcanoes",
      await Bun.file(fixture("volcano-wfs.json")).json(),
    );
    expect(result.valid).toBe(true);
    expect(result.recordCount).toBe(16);
    expect(result.drift).toEqual([]);
  });

  test("ACELDAT reportes2", async () => {
    const result = checkExternalContract(
      "aceldat-reports",
      await Bun.file(fixture("aceldat-reportes2.json")).json(),
    );
    expect(result.valid).toBe(true);
    expect(result.drift).toEqual([]);
  });

  test("USGS FDSN", async () => {
    const result = checkExternalContract(
      "usgs",
      await Bun.file(fixture("usgs-sample.json")).json(),
    );
    expect(result.valid).toBe(true);
  });

  test("CENSIS XLSX header exacto", async () => {
    const rows = parseXlsxRows(
      new Uint8Array(
        await Bun.file(fixture("censis-jul2026.xlsx")).arrayBuffer(),
      ),
    );
    const result = checkCensisHeader(rows);
    expect(result.valid).toBe(true);
    expect(result.recordCount).toBe(85);
    expect(result.drift).toEqual([]);
  });
});

describe("linter de contratos externos: detecta drift con nombre y apellido", () => {
  test("campo renombrado rompe el contrato y se nombra", async () => {
    const data = (await Bun.file(fixture("volcano-wfs.json")).json()) as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    for (const feature of data.features) {
      feature.properties.nivel_actual = feature.properties.nivel;
      delete feature.properties.nivel;
    }
    const result = checkExternalContract("volcanoes", data);
    expect(result.valid).toBe(false);
    expect(result.drift.join(" ")).toContain("nivel");
    expect(result.drift.join(" ")).toContain("nivel_actual");
    expect(result.detail).toContain("ROTO");
  });

  test("cambio de tipo rompe el contrato", async () => {
    const data = (await Bun.file(
      fixture("aceldat-reportes2.json"),
    ).json()) as Array<{
      magnitud: unknown;
    }>;
    if (data[0]) data[0].magnitud = "5.1";
    const result = checkExternalContract("aceldat-reports", data);
    expect(result.valid).toBe(false);
    expect(result.drift.join(" ")).toContain("magnitud");
  });

  test("campo nuevo NO rompe pero queda reportado", async () => {
    const data = (await Bun.file(fixture("arcgis-latest.json")).json()) as {
      features: Array<{ properties: Record<string, unknown> }>;
    };
    if (data.features[0]) data.features[0].properties.alerta_tsunami = "no";
    const result = checkExternalContract("arcgis-latest", data);
    expect(result.valid).toBe(true);
    expect(result.drift.join(" ")).toContain("alerta_tsunami");
    expect(result.detail).toContain("novedades");
  });

  test("columna renombrada del XLSX se nombra en el drift", () => {
    const result = checkCensisHeader([
      [
        "fecha UTC",
        "hora UTC",
        "lat",
        "longitud (º)",
        "profundidad (km)",
        "magnitud (M)",
      ],
      ["2026-07-01", "00:11:35", "-9.15", "-79.06", "30", "3.6"],
    ]);
    expect(result.valid).toBe(false);
    expect(result.drift.join(" ")).toContain("latitud (º)");
    expect(result.drift.join(" ")).toContain("NUEVO columna: lat");
  });

  test("respuesta vacía rompe el contrato de features", () => {
    const result = checkExternalContract("volcanoes", {
      type: "FeatureCollection",
      features: [],
    });
    expect(result.valid).toBe(false);
  });
});
