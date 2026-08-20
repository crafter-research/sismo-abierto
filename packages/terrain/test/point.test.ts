import { describe, expect, test } from "bun:test";
import { queryPoint, studyLevelLabel } from "../src/point/query-point.ts";

interface MockRow {
  [key: string]: unknown;
}

function mockSql(
  igpRows: MockRow[],
  ingemmetRows: MockRow[],
  faultRows: MockRow[] = [],
) {
  const calls: { text: string; params: unknown[] }[] = [];
  const sql = {
    query: (text: string, params: unknown[] = []) => {
      calls.push({ text, params });
      // nearestFaults también consulta ingemmet_features pero con `<->`, no
      // `ST_Contains`: hay que distinguirla antes de caer al branch de IGP.
      if (text.includes("<->")) return Promise.resolve(faultRows);
      const rows = text.includes("terrain_features") ? igpRows : ingemmetRows;
      return Promise.resolve(rows);
    },
    // biome-ignore lint/suspicious/noExplicitAny: mock stands in for NeonQueryFunction, only `.query` is used by queryPoint
  } as any;
  return { sql, calls };
}

describe("queryPoint", () => {
  test("conserva ambas ciudades cuando el punto cae en dos polígonos del IGP", async () => {
    const { sql } = mockSql(
      [
        {
          dimension: "Geologia",
          city: "piura",
          properties: { ciudad: "Piura", fecha: "2019" },
        },
        {
          dimension: "Geologia",
          city: "castilla",
          properties: { ciudad: "Castilla", fecha: "2019" },
        },
      ],
      [],
    );

    const result = await queryPoint(-80.63, -5.19, sql);

    expect(result.cities).toEqual(["piura", "castilla"]);
    expect(result.igp).toHaveLength(2);
  });

  test("studyLevel es nacional cuando solo hay INGEMMET", async () => {
    const { sql } = mockSql(
      [],
      [
        {
          layer_id: "ingemmet-geomorfologia",
          properties: { SUBUNIDAD: "Colina", ETIQUETA: "Co", CODIGO: "1" },
          attribution: "INGEMMET",
          fetched_at: "2026-08-01T00:00:00Z",
        },
      ],
    );

    const result = await queryPoint(-77.03, -12.05, sql);

    expect(result.studyLevel).toBe("nacional");
    expect(result.igp).toHaveLength(0);
    expect(result.cities).toEqual([]);
  });

  test("studyLevel es microzonificacion cuando hay IGP, con o sin INGEMMET", async () => {
    const { sql } = mockSql(
      [
        {
          dimension: "CapacidadPortante",
          city: "arequipa",
          properties: { capac_port: "> 3 Kg/cm2", tipo: "Alta", fecha: "2014" },
        },
      ],
      [
        {
          layer_id: "ingemmet-fallas",
          properties: { DESCRIP: "Falla X", CODI: "F1" },
          attribution: "INGEMMET",
          fetched_at: "2026-08-01T00:00:00Z",
        },
      ],
    );

    const result = await queryPoint(-71.53, -16.4, sql);

    expect(result.studyLevel).toBe("microzonificacion");
  });

  test("studyLevel es ninguno cuando ninguna tabla tiene filas", async () => {
    const { sql } = mockSql([], []);

    const result = await queryPoint(-70.0, -10.0, sql);

    expect(result.studyLevel).toBe("ninguno");
    expect(result.igp).toEqual([]);
    expect(result.ingemmet).toEqual([]);
    expect(result.cities).toEqual([]);
  });

  test("attribution y fetchedAt de INGEMMET nunca se pierden", async () => {
    const { sql } = mockSql(
      [],
      [
        {
          layer_id: "ingemmet-geomorfologia",
          properties: { SUBUNIDAD: "Colina", ETIQUETA: "Co", CODIGO: "1" },
          attribution: "INGEMMET - Instituto Geológico, Minero y Metalúrgico",
          fetched_at: "2026-08-01T00:00:00Z",
        },
      ],
    );

    const result = await queryPoint(-77.03, -12.05, sql);

    expect(result.ingemmet[0]?.attribution).toBe(
      "INGEMMET - Instituto Geológico, Minero y Metalúrgico",
    );
    expect(result.ingemmet[0]?.fetchedAt).toBe("2026-08-01T00:00:00Z");
  });

  test("studyYear del IGP viene de properties.fecha, null si falta", async () => {
    const { sql } = mockSql(
      [
        {
          dimension: "Suelos",
          city: "trujillo",
          properties: { tipo: "S2" },
        },
      ],
      [],
    );

    const result = await queryPoint(-79.03, -8.11, sql);

    expect(result.igp[0]?.studyYear).toBeNull();
  });

  test("studyYear se normaliza a string cuando la capa lo publica como number", async () => {
    const { sql } = mockSql(
      [
        {
          dimension: "Geologia",
          city: "piura",
          properties: { ciudad: "Piura", fecha: 2018 },
        },
      ],
      [],
    );

    const result = await queryPoint(-80.63, -5.19, sql);

    expect(result.igp[0]?.studyYear).toBe("2018");
  });

  test("pasa lon/lat como parámetros $1 $2 a las tres consultas", async () => {
    const { sql, calls } = mockSql([], []);

    await queryPoint(-77.03, -12.05, sql);

    expect(calls).toHaveLength(3);
    const containsCalls = calls.filter((call) =>
      call.text.includes("ST_Contains"),
    );
    const nearestCalls = calls.filter((call) => call.text.includes("<->"));
    expect(containsCalls).toHaveLength(2);
    expect(nearestCalls).toHaveLength(1);
    for (const call of [...containsCalls, ...nearestCalls]) {
      expect(call.params[0]).toBe(-77.03);
      expect(call.params[1]).toBe(-12.05);
    }
  });
});

describe("studyLevelLabel", () => {
  test("explica los tres niveles en español", () => {
    expect(studyLevelLabel("microzonificacion")).toContain("microzonificación");
    expect(studyLevelLabel("nacional")).toContain("INGEMMET");
    expect(studyLevelLabel("ninguno")).toContain("Sin estudio");
  });
});
