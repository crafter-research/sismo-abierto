import { describe, expect, test } from "bun:test";
import { FAULT_MAX_DISTANCE_M, nearestFaults } from "../src/point/faults.ts";

interface MockRow {
  [key: string]: unknown;
}

function mockSql(rows: MockRow[]) {
  const calls: { text: string; params: unknown[] }[] = [];
  const sql = {
    query: (text: string, params: unknown[] = []) => {
      calls.push({ text, params });
      return Promise.resolve(rows);
    },
    // biome-ignore lint/suspicious/noExplicitAny: mock stands in for NeonQueryFunction, only `.query` is used by nearestFaults
  } as any;
  return { sql, calls };
}

describe("nearestFaults", () => {
  test("mapea distancia a número redondeado y marca fallas confirmadas", async () => {
    const { sql } = mockSql([
      { d: "Falla inferida", m: "5267" },
      { d: "Falla inversa inferida", m: "5684.4" },
    ]);

    const result = await nearestFaults(-77.03, -12.05, sql);

    expect(result).toEqual([
      {
        description: "Falla inferida",
        distanceMeters: 5267,
        isConfirmedFault: true,
      },
      {
        description: "Falla inversa inferida",
        distanceMeters: 5684,
        isConfirmedFault: true,
      },
    ]);
  });

  test("marca Lineamiento como no confirmado", async () => {
    const { sql } = mockSql([{ d: "Lineamiento", m: "8133" }]);

    const result = await nearestFaults(-76.7, -11.93, sql);

    expect(result[0]?.isConfirmedFault).toBe(false);
  });

  test("excluye Flechas y DESCRIP vacío en la consulta SQL", async () => {
    const { sql, calls } = mockSql([]);

    await nearestFaults(-71.54, -16.4, sql);

    expect(calls).toHaveLength(1);
    const query = calls[0]?.text ?? "";
    expect(query).toContain("layer_id = 'ingemmet-fallas'");
    expect(query).toContain("<> 'Flechas'");
    expect(query).toContain("IS NOT NULL");
    expect(query).toContain("trim(properties->>'DESCRIP') <> ''");
  });

  test("usa el operador de vecino más cercano <-> sobre geom, no ST_Contains", async () => {
    const { sql, calls } = mockSql([]);

    await nearestFaults(-77.03, -12.05, sql);

    const query = calls[0]?.text ?? "";
    expect(query).toContain("<->");
    expect(query).not.toContain("ST_Contains");
  });

  test("pasa lon, lat y limit como parámetros posicionales", async () => {
    const { sql, calls } = mockSql([]);

    await nearestFaults(-77.03, -12.05, sql, 5);

    expect(calls[0]?.params).toEqual([-77.03, -12.05, 5, FAULT_MAX_DISTANCE_M]);
  });

  test("limit por defecto es 3", async () => {
    const { sql, calls } = mockSql([]);

    await nearestFaults(-77.03, -12.05, sql);

    expect(calls[0]?.params).toEqual([-77.03, -12.05, 3, FAULT_MAX_DISTANCE_M]);
  });

  test("array vacío cuando no hay fallas cercanas", async () => {
    const { sql } = mockSql([]);

    const result = await nearestFaults(-70.0, -10.0, sql);

    expect(result).toEqual([]);
  });
});

describe("corte por distancia", () => {
  test("acota la búsqueda al radio medido", async () => {
    let sqlText = "";
    let params: unknown[] = [];
    const sql = {
      query: async (text: string, values: unknown[]) => {
        sqlText = text;
        params = values;
        return [];
      },
    } as unknown as Parameters<typeof nearestFaults>[2];

    await nearestFaults(-80.5, -12.0, sql);

    expect(sqlText).toContain("ST_DWithin");
    expect(params).toContain(FAULT_MAX_DISTANCE_M);
  });

  test("un punto sin fallas dentro del radio devuelve lista vacía", async () => {
    const sql = {
      query: async () => [],
    } as unknown as Parameters<typeof nearestFaults>[2];

    expect(await nearestFaults(-80.5, -12.0, sql)).toEqual([]);
  });
});
