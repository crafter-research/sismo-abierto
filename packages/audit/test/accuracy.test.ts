import { describe, expect, test } from "bun:test";
import {
  getPrediction,
  loadClaimedValidations,
  magnitudeError,
  principalSource,
  scoreClaim,
} from "../src/index.ts";

describe("error de magnitud", () => {
  test("una magnitud dentro del rango no tiene error", () => {
    expect(magnitudeError(4.4, 4.1, 4.5)).toBe(0);
    expect(magnitudeError(4.1, 4.1, 4.5)).toBe(0);
    expect(magnitudeError(4.5, 4.1, 4.5)).toBe(0);
  });

  test("mide la distancia al borde más cercano", () => {
    expect(magnitudeError(3.8, 4.3, 4.7)).toBe(0.5);
    expect(magnitudeError(5.7, 5.0, 5.5)).toBe(0.2);
  });
});

describe("fuente principal", () => {
  test("para un epicentro en Perú manda el IGP", async () => {
    const claims = await loadClaimedValidations();
    const lurin = claims.find((c) => c.predictionId === "W20260817-P1");
    if (!lurin) throw new Error("falta el reclamo W20260817-P1");
    expect(principalSource(lurin)?.sourceId).toBe("igp-censis-catalogo");
  });

  test("fuera del Perú manda el USGS", async () => {
    const claims = await loadClaimedValidations();
    const venezuela = claims.find((c) => c.predictionId === "W20260817-P5");
    if (!venezuela) throw new Error("falta el reclamo W20260817-P5");
    expect(principalSource(venezuela)?.sourceId).toBe("usgs-fdsn");
  });

  test("una fuente sin magnitud no se elige", async () => {
    const claims = await loadClaimedValidations();
    const sinRegistro = claims.find((c) => c.predictionId === "W20260803-P5");
    if (!sinRegistro) throw new Error("falta el reclamo W20260803-P5");
    expect(principalSource(sinRegistro)).toBeNull();
  });
});

describe("puntaje por dimensión", () => {
  test("un destino sin límites definidos queda indeterminado, no fallado", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260810-P6");
    const prediction = await getPrediction("W20260810-P6");
    if (!claim || !prediction) throw new Error("falta W20260810-P6");
    const score = scoreClaim(claim, prediction);
    expect(score.geography.status).toBe("undetermined");
    expect(score.magnitude.status).toBe("within");
  });

  test("sin registro oficial la magnitud queda indeterminada", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260803-P5");
    const prediction = await getPrediction("W20260803-P5");
    if (!claim || !prediction) throw new Error("falta W20260803-P5");
    const score = scoreClaim(claim, prediction);
    expect(score.magnitude.status).toBe("undetermined");
    expect(score.magnitude.error).toBeNull();
  });

  test("todo reclamo registrado cae dentro del plazo publicado", async () => {
    const claims = await loadClaimedValidations();
    for (const claim of claims) {
      const prediction = await getPrediction(claim.predictionId);
      if (!prediction) throw new Error(`falta ${claim.predictionId}`);
      expect(scoreClaim(claim, prediction).window.status).toBe("within");
    }
  });

  test("todo reclamo se publicó antes de que cerrara su ventana", async () => {
    const claims = await loadClaimedValidations();
    for (const claim of claims) {
      const prediction = await getPrediction(claim.predictionId);
      if (!prediction) throw new Error(`falta ${claim.predictionId}`);
      expect(scoreClaim(claim, prediction).publishedBeforeWindowClosed).toBe(
        true,
      );
    }
  });
});
