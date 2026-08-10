import { describe, expect, test } from "bun:test";
import { parseCensisRows } from "../src/adapters/censis.ts";
import { parseLatestFeatureCollection } from "../src/adapters/latest.ts";
import {
  fetchSgcEvents,
  parseSgcFeature,
  parseSgcFeatureCollection,
} from "../src/adapters/sgc.ts";
import { SourceError } from "../src/errors.ts";
import {
  censisEventId,
  parseCensisEventId,
  parseRanEventId,
  resolveEventDateRange,
  selectMajorEvent,
} from "../src/events.ts";
import {
  limaLocalToUtcIso,
  utcIsoToAceldatDatetime,
  utcIsoToLimaIso,
} from "../src/lima-time.ts";
import { parseXlsxRows } from "../src/xlsx.ts";

const fixture = (name: string) =>
  new URL(`./fixtures/${name}`, import.meta.url).pathname;

describe("xlsx + CENSIS", () => {
  test("parsea el XLSX real de CENSIS", async () => {
    const bytes = new Uint8Array(
      await Bun.file(fixture("censis-jul2026.xlsx")).arrayBuffer(),
    );
    const rows = parseXlsxRows(bytes);
    expect(rows.length).toBe(86);
    expect(rows[0]?.[0]).toBe("fecha UTC");
    const parsed = parseCensisRows(rows);
    expect(parsed.length).toBe(85);
    const first = parsed[0];
    expect(first?.timeUtcIso).toBe("2026-07-01T00:11:35Z");
    expect(first?.magnitude).toBe(3.6);
    expect(first?.depthKm).toBe(30);
    expect(first?.latitude).toBe(-9.15);
    expect(first?.longitude).toBe(-79.06);
  });

  test("header inesperado dispara SourceError de schema", () => {
    expect(() =>
      parseCensisRows([
        ["algo", "raro"],
        ["1", "2"],
      ]),
    ).toThrow(SourceError);
  });

  test("fila no numérica dispara SourceError en vez de datos vacíos", () => {
    expect(() =>
      parseCensisRows([
        ["fecha UTC", "hora UTC", "lat", "lon", "prof", "mag"],
        ["2026-07-01", "00:11:35", "abc", "-79.06", "30", "3.6"],
      ]),
    ).toThrow(SourceError);
  });
});

describe("último sismo", () => {
  test("parsea la respuesta ArcGIS real", async () => {
    const data = await Bun.file(fixture("arcgis-latest.json")).json();
    const parsed = parseLatestFeatureCollection(
      data,
      "igp-arcgis-ultimo-sismo",
    );
    expect(parsed.magnitud).toBe(4.3);
    expect(parsed.profundidad).toBe(59);
    expect(parsed.referencia).toContain("Ica");
    expect(parsed.timeUtc).toBe("2026-07-20T11:51:15.000Z");
    expect(parsed.provenance.source.id).toBe("igp-arcgis-ultimo-sismo");
    expect(parsed.provenance.classification).toBe("official");
  });

  test("parsea la respuesta WFS real con timeStamp del GeoServer", async () => {
    const data = await Bun.file(fixture("wfs-latest.json")).json();
    const parsed = parseLatestFeatureCollection(data, "igp-wfs-ultimo-sismo");
    expect(parsed.magnitud).toBe(4.3);
    expect(parsed.provenance.sourceUpdatedAt).toBe("2026-07-21T02:02:47.036Z");
  });

  test("features vacíos disparan SourceError kind empty", () => {
    expect(() =>
      parseLatestFeatureCollection(
        { type: "FeatureCollection", features: [] },
        "igp-arcgis-ultimo-sismo",
      ),
    ).toThrow(SourceError);
  });

  test("campos faltantes disparan SourceError kind schema", () => {
    try {
      parseLatestFeatureCollection(
        {
          type: "FeatureCollection",
          features: [{ geometry: null, properties: { magnitud: 4.3 } }],
        },
        "igp-arcgis-ultimo-sismo",
      );
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SourceError);
      expect((error as SourceError).kind).toBe("schema");
    }
  });
});

describe("Servicio Geológico Colombiano", () => {
  test("normaliza biweekly y excluye agencias externas", async () => {
    const data = await Bun.file(fixture("sgc-biweekly.json")).json();
    const events = parseSgcFeatureCollection(data);
    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe("sgc-SGC2026pqqmro");
    expect(events[0]?.magnitude).toBe(7.4);
    expect(events[0]?.latitude).toBeCloseTo(4.990935);
    expect(events[0]?.longitude).toBeCloseTo(-76.291741);
    expect(events[0]?.timeUtc).toBe("2026-08-10T12:34:27Z");
    expect(events[0]?.timeLocal).toBe("2026-08-10T07:34:27-05:00");
    expect(events[0]?.reviewStatus).toBe("manual");
    expect(events[0]?.provenance.timezone).toBe("America/Bogota");
  });

  test("selecciona un evento M7+ aunque no sea el último del feed", async () => {
    const data = await Bun.file(fixture("sgc-biweekly.json")).json();
    const events = parseSgcFeatureCollection(data);
    const source = events[0];
    expect(source).toBeDefined();
    if (!source) throw new Error("Fixture SGC sin evento oficial");
    const minor = { ...source, id: "sgc-minor", magnitude: 2.4 };
    const major = selectMajorEvent([minor, ...events]);
    expect(major?.id).toBe("sgc-SGC2026pqqmro");
    expect(major?.magnitude).toBe(7.4);
  });

  test("corrige el orden latitud-longitud de archive", async () => {
    const data = await Bun.file(fixture("sgc-biweekly.json")).json();
    const feature = structuredClone(data.features[0]);
    feature.geometry.coordinates = [4.990934719865107, -76.291741067906, 103];
    const event = parseSgcFeature(feature, "latitude-longitude");
    expect(event.latitude).toBeCloseTo(4.990935);
    expect(event.longitude).toBeCloseTo(-76.291741);
  });

  test("detecta errores internos enviados con HTTP 200", () => {
    expect(() =>
      parseSgcFeatureCollection({
        error: { statusCode: 503, error: "startdate must be lower" },
      }),
    ).toThrow(SourceError);
  });

  test("protege rangos largos sin filtro de magnitud", async () => {
    await expect(
      fetchSgcEvents(
        { start: "2026-01-01", end: "2026-08-10" },
        { provider: "sgc" },
      ),
    ).rejects.toMatchObject({ kind: "invalid" });
  });

  test("protege rangos largos con magnitud no numérica", async () => {
    await expect(
      fetchSgcEvents(
        { start: "2026-01-01", end: "2026-08-10" },
        { provider: "sgc", minMagnitude: Number.NaN },
      ),
    ).rejects.toMatchObject({ kind: "invalid" });
  });
});

describe("IDs de eventos", () => {
  test("censisEventId es estable y reversible", () => {
    const row = {
      dateUtc: "2026-07-01",
      timeUtc: "00:11:35",
      timeUtcIso: "2026-07-01T00:11:35Z",
      timeLocalIso: "2026-06-30T19:11:35-05:00",
      latitude: -9.15,
      longitude: -79.06,
      depthKm: 30,
      magnitude: 3.6,
    };
    const id = censisEventId(row);
    expect(id).toBe("censis-20260701T001135Z_-9.15_-79.06");
    const parsed = parseCensisEventId(id);
    expect(parsed?.timeUtcIso).toBe("2026-07-01T00:11:35Z");
    expect(parsed?.latitude).toBe(-9.15);
    expect(parsed?.longitude).toBe(-79.06);
  });

  test("parseRanEventId acepta solo ran-N", () => {
    expect(parseRanEventId("ran-20260468")).toBe(20260468);
    expect(parseRanEventId("censis-x")).toBeNull();
    expect(parseRanEventId("ran-abc")).toBeNull();
  });
});

describe("rangos de eventos", () => {
  test("ytd respeta el año local de Perú y Colombia", () => {
    const now = new Date("2027-01-01T02:00:00Z");
    expect(
      resolveEventDateRange({ provider: "igp", since: "ytd" }, now),
    ).toEqual({ start: "2026-01-01", end: "2026-12-31" });
    expect(
      resolveEventDateRange({ provider: "sgc", since: "ytd" }, now),
    ).toEqual({ start: "2026-01-01", end: "2026-12-31" });
  });
});

describe("tiempo de Lima", () => {
  test("convierte hora local IGP a UTC (+5)", () => {
    expect(limaLocalToUtcIso("20/07/2026", "06:51:15")).toBe(
      "2026-07-20T11:51:15.000Z",
    );
    expect(limaLocalToUtcIso("2026-07-20", "23:30:00")).toBe(
      "2026-07-21T04:30:00.000Z",
    );
  });

  test("convierte UTC a ISO de Lima con offset explícito", () => {
    expect(utcIsoToLimaIso("2026-07-20T11:51:15.000Z")).toBe(
      "2026-07-20T06:51:15-05:00",
    );
  });

  test("deriva el datetime de ACELDAT desde UTC", () => {
    expect(utcIsoToAceldatDatetime("2026-07-19T02:24:34.000Z")).toBe(
      "20260719_022434",
    );
  });

  test("entradas ilegibles devuelven null, no fechas inventadas", () => {
    expect(limaLocalToUtcIso("julio 20", "06:51:15")).toBeNull();
    expect(utcIsoToLimaIso("no-date")).toBeNull();
  });
});
