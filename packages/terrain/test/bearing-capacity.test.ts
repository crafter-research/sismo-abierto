import { describe, expect, test } from "bun:test";
import {
  bearingCapacityCoverage,
  cityBearingCapacity,
  __groupRowsForTest as groupRows,
} from "../src/bearing-capacity.ts";

const ROWS = [
  {
    city: "alto_alianza",
    nombre: "Alto de la Alianza",
    capac_port: "0.65 kg/cm²",
    tipo: "Muy Baja",
    fecha: "2017",
  },
  {
    city: "alto_alianza",
    nombre: "Alto de la Alianza",
    capac_port: "4.06 kg/cm²",
    tipo: "Alta",
    fecha: "2017",
  },
  {
    city: "alto_alianza",
    nombre: "Alto de la Alianza",
    capac_port: "2.44 kg/cm²",
    tipo: "Media",
    fecha: "2017",
  },
  {
    city: "acari",
    nombre: "Acari",
    capac_port: "> 3 Kg/cm2",
    tipo: "Alta",
    fecha: "2014",
  },
  {
    city: "acari",
    nombre: "Acari",
    capac_port: "> 3 Kg/cm2",
    tipo: "Alta",
    fecha: "2014",
  },
];

describe("agrupamiento por ciudad", () => {
  test("ordena de mejor a peor terreno, no alfabéticamente", () => {
    const alto = groupRows(ROWS).get("alto-de-la-alianza");
    expect(alto?.zones.map((z) => z.rating)).toEqual([
      "Alta",
      "Media",
      "Muy Baja",
    ]);
  });

  test("colapsa polígonos repetidos en una entrada con conteo", () => {
    const acari = groupRows(ROWS).get("acari");
    expect(acari?.zones).toHaveLength(1);
    expect(acari?.zones[0]?.polygonCount).toBe(2);
  });

  test("indexa por el slug de la zonificación, no por el nombre de capa", () => {
    const grouped = groupRows(ROWS);
    expect(grouped.has("alto-de-la-alianza")).toBe(true);
    expect(grouped.get("alto-de-la-alianza")?.city).toBe("Alto de la Alianza");
  });

  test("una fila sin capacidad no genera entrada", () => {
    const grouped = groupRows([
      { city: "x", nombre: "X", capac_port: null, tipo: "Alta", fecha: "2020" },
    ]);
    expect(grouped.size).toBe(0);
  });
});

describe("sin base configurada", () => {
  test("devuelve null en vez de inventar capacidad", async () => {
    expect(await cityBearingCapacity("arequipa", undefined)).toBeNull();
  });

  test("la cobertura queda vacía, no falla", async () => {
    expect((await bearingCapacityCoverage(undefined)).size).toBe(0);
  });
});
