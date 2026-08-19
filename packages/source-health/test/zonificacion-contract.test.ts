import { describe, expect, test } from "bun:test";
import { checkExternalContract } from "../src/external-contracts.ts";
import { buildProbeConfigs } from "../src/probe-configs.ts";

// Respuesta mínima del WFS de zonificación del IGP, con la forma real:
// MultiPolygon y numberMatched con el total de la capa.
const payload = {
  type: "FeatureCollection",
  numberMatched: 544,
  numberReturned: 1,
  features: [
    {
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-81.1, -5.1],
              [-81.0, -5.1],
              [-81.0, -5.0],
              [-81.1, -5.1],
            ],
          ],
        ],
      },
      properties: {
        ciudad: "Paita",
        departamento: "PIURA",
        zona: "Suelo Tipo S3: Blando",
        fecha: 2018,
        st_area_sh: 0.00003,
        st_length_: 0.04,
      },
    },
  ],
};

function firstProperties(collection: typeof payload): Record<string, unknown> {
  const properties = collection.features[0]?.properties;
  if (!properties) throw new Error("payload de prueba sin properties");
  return properties as Record<string, unknown>;
}

describe("contrato wfs-zonificacion", () => {
  test("acepta la geometría MultiPolygon de la capa de suelos", () => {
    const result = checkExternalContract("wfs-zonificacion", payload);
    expect(result.valid).toBe(true);
    expect(result.drift).toEqual([]);
  });

  test("cuenta el total de la capa, no los registros devueltos", () => {
    const result = checkExternalContract("wfs-zonificacion", payload);
    expect(result.recordCount).toBe(544);
  });

  test("detecta que la fuente dejó de publicar el tipo de suelo", () => {
    const broken = structuredClone(payload);
    const properties = firstProperties(broken);
    properties.zona = undefined;
    expect(checkExternalContract("wfs-zonificacion", broken).valid).toBe(false);
  });

  test("detecta que la fuente renombró la ciudad", () => {
    const renamed = structuredClone(payload);
    const properties = firstProperties(renamed);
    properties.municipio = properties.ciudad;
    properties.ciudad = undefined;
    expect(checkExternalContract("wfs-zonificacion", renamed).valid).toBe(
      false,
    );
  });
});

describe("sonda de zonificación", () => {
  test("está registrada y pide un solo registro para no bajar la capa entera", () => {
    const config = buildProbeConfigs().find(
      (entry) => entry.sourceId === "igp-wfs-zonificacion",
    );
    expect(config).toBeDefined();
    expect(config?.url).toContain("count=1");
    expect(config?.contract).toBe("wfs-zonificacion");
  });

  test("no declara frescura porque la fuente no publica fecha por registro", () => {
    const config = buildProbeConfigs().find(
      (entry) => entry.sourceId === "igp-wfs-zonificacion",
    );
    expect(config?.freshnessKnown).toBe(false);
  });
});
