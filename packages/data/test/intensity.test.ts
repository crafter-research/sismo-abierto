import { describe, expect, test } from "bun:test";
import { haversineKm } from "../src/geo.ts";
import {
  destinationPoint,
  distanceFromEvent,
  estimateMmi,
  hypocentralKm,
  mmiRoman,
  radiusForMmi,
} from "../src/intensity.ts";

// Junín, 2026-11-20: M 6.7, 129 km de profundidad, IGP reporta "V Junín".
const junin = {
  latitude: -10.97,
  longitude: -76.19,
  depthKm: 129,
  magnitude: 6.7,
};

describe("estimateMmi", () => {
  test("matches the official intensity above the Junín hypocenter", () => {
    expect(mmiRoman(estimateMmi(6.7, hypocentralKm(0, 129)))).toBe("V");
  });

  test("decreases with distance", () => {
    const near = estimateMmi(6.7, 150);
    const far = estimateMmi(6.7, 600);
    expect(far).toBeLessThan(near);
  });
});

describe("radiusForMmi", () => {
  test("lands on the requested intensity", () => {
    const radius = radiusForMmi(6.7, 129, 3);
    expect(radius).not.toBeNull();
    const mmi = estimateMmi(6.7, hypocentralKm(radius as number, 129));
    expect(mmi).toBeCloseTo(3, 3);
  });

  test("is null when the epicenter is already below the level", () => {
    expect(radiusForMmi(6.7, 129, 6)).toBeNull();
  });

  test("rings grow as intensity drops", () => {
    const iv = radiusForMmi(6.7, 129, 4) as number;
    const ii = radiusForMmi(6.7, 129, 2) as number;
    expect(ii).toBeGreaterThan(iv);
  });
});

describe("distanceFromEvent", () => {
  test("Huancavelica feels less than the epicenter and more than Abancay", () => {
    const huancavelica = distanceFromEvent(junin, -12.787, -74.976);
    const abancay = distanceFromEvent(junin, -13.636, -72.881);
    expect(huancavelica.estimatedMmi).toBeLessThan(5);
    expect(abancay.estimatedMmi).toBeLessThan(huancavelica.estimatedMmi);
    expect(abancay.sWaveSeconds).toBeGreaterThan(huancavelica.sWaveSeconds);
  });
});

describe("destinationPoint", () => {
  test("round-trips through haversine", () => {
    const [lon, lat] = destinationPoint(-10.97, -76.19, 135, 400);
    expect(haversineKm(-10.97, -76.19, lat, lon)).toBeCloseTo(400, 3);
  });
});
