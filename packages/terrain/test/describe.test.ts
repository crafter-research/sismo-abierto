import { describe, expect, test } from "bun:test";
import {
  describeIgpMatch,
  describeIngemmetMatch,
  isNoiseField,
} from "../src/point/describe.ts";

describe("describeIgpMatch", () => {
  test("Geologia usa unidades como primario y simbolo como secundario", () => {
    const result = describeIgpMatch("Geologia", {
      unidades: "Super Unidad Santa Rosa - tonalita, diorita",
      simbolo: "Ks-bc/sr-tn,di",
      ciudad: "Chosica",
      fecha: 2012,
    });

    expect(result.primary).toBe("Super Unidad Santa Rosa - tonalita, diorita");
    expect(result.secondary).toBe("Ks-bc/sr-tn,di");
  });

  test("Geomorfologia usa unidades sin secundario", () => {
    const result = describeIgpMatch("Geomorfologia", {
      unidades: "Ladera empinada",
      ciudad: "Chosica",
    });

    expect(result.primary).toBe("Ladera empinada");
    expect(result.secondary).toBeNull();
  });

  test("Suelos usa tipo como primario y sucs como secundario", () => {
    const result = describeIgpMatch("Suelos", {
      sucs: "CL",
      tipo: "Arcillas inorgánicas (CL)",
      ciudad: "Chaclacayo",
    });

    expect(result.primary).toBe("Arcillas inorgánicas (CL)");
    expect(result.secondary).toBe("CL");
  });

  test("ZonificacionSismica usa zona", () => {
    const result = describeIgpMatch("ZonificacionSismica", {
      zona: "Suelo Tipo S3: Blando",
    });

    expect(result.primary).toBe("Suelo Tipo S3: Blando");
    expect(result.secondary).toBeNull();
  });

  test("CapacidadPortante usa capac_port como primario y tipo como secundario", () => {
    const result = describeIgpMatch("CapacidadPortante", {
      capac_port: "1 - 2 kg/cm2",
      tipo: "Baja",
    });

    expect(result.primary).toBe("1 - 2 kg/cm2");
    expect(result.secondary).toBe("Baja");
  });

  test("Geodinamica usa eventos", () => {
    const result = describeIgpMatch("Geodinamica", {
      eventos: "Flujo de detritos y/o lodo y/o aluviales",
    });

    expect(result.primary).toBe("Flujo de detritos y/o lodo y/o aluviales");
  });

  test("dimension desconocida no revienta, devuelve null", () => {
    const result = describeIgpMatch("Otra", { unidades: "x" });

    expect(result.primary).toBeNull();
    expect(result.secondary).toBeNull();
  });

  test("campo primario ausente devuelve null en vez de vacio", () => {
    const result = describeIgpMatch("Geologia", { ciudad: "Lima" });

    expect(result.primary).toBeNull();
  });

  test("string vacio no cuenta como valor presente", () => {
    const result = describeIgpMatch("Geologia", { unidades: "   " });

    expect(result.primary).toBeNull();
  });
});

describe("describeIngemmetMatch", () => {
  test("geomorfologia usa SUBUNIDAD", () => {
    const result = describeIngemmetMatch("ingemmet-geomorfologia", {
      CODIGO: "610",
      ETIQUETA: "Pl-al",
      SUBUNIDAD: "Llanura o planicie aluvial",
    });

    expect(result).toBe("Llanura o planicie aluvial");
  });

  test("fallas usa DESCRIP", () => {
    const result = describeIngemmetMatch("ingemmet-fallas", {
      DESCRIP: "Falla normal",
      CODI: "F1",
    });

    expect(result).toBe("Falla normal");
  });

  test("layer desconocida devuelve null", () => {
    const result = describeIngemmetMatch("ingemmet-otra", { X: "y" });

    expect(result).toBeNull();
  });
});

describe("isNoiseField", () => {
  test("marca campos de GIS y metadata ya mostrada como ruido", () => {
    expect(isNoiseField("st_area_sh")).toBe(true);
    expect(isNoiseField("st_length_")).toBe(true);
    expect(isNoiseField("objectid")).toBe(true);
    expect(isNoiseField("fecha")).toBe(true);
    expect(isNoiseField("ciudad")).toBe(true);
  });

  test("no marca campos descriptivos como ruido", () => {
    expect(isNoiseField("unidades")).toBe(false);
    expect(isNoiseField("capac_port")).toBe(false);
  });
});
