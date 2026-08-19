import { describe, expect, test } from "bun:test";
import {
  getPrediction,
  loadClaimedValidations,
  loadHistoricalReportRegistry,
  loadPanoramaReportRegistry,
  magnitudeError,
  openWindowState,
  principalSource,
  scoreClaim,
  sourceConsensus,
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

describe("visibilidad de los reclamos", () => {
  test("todo reclamo pertenece a un panorama o informe que lo puede mostrar", async () => {
    const claims = await loadClaimedValidations();
    const panoramas = await loadPanoramaReportRegistry();
    const informes = await loadHistoricalReportRegistry();
    for (const claim of claims) {
      const enPanorama = panoramas.some((report) =>
        report.points.some(
          (point) => point.predictionId === claim.predictionId,
        ),
      );
      const enInforme = informes.some((report) =>
        report.points.some(
          (point) =>
            `R${report.reportNumber}-P${point.pointNumber}` ===
            claim.predictionId,
        ),
      );
      expect(enPanorama || enInforme).toBe(true);
    }
  });

  test("un reclamo sobre una ventana abierta sigue siendo visible", async () => {
    const claims = await loadClaimedValidations();
    const abiertos = [] as string[];
    for (const claim of claims) {
      const prediction = await getPrediction(claim.predictionId);
      if (!prediction) throw new Error(`falta ${claim.predictionId}`);
      if (Date.parse(prediction.deadlineEndLima) > Date.now()) {
        abiertos.push(claim.predictionId);
      }
    }
    // Son los casos donde la cuenta declaró un acierto antes de que la ventana
    // cerrara. Si dejan de estar en el registro, la tabla los oculta y el
    // patrón deja de ser observable.
    expect(abiertos.length).toBeGreaterThan(0);
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

describe("sismo alegado", () => {
  test("un reclamo sin candidato oficial conserva el evento que la cuenta invocó", async () => {
    const claims = await loadClaimedValidations();
    const sinCandidato = claims.filter(
      (claim) => claim.eventPlace.length > 0 && claim.claimedMagnitude !== null,
    );
    // Sin este dato la tabla solo podría decir "ningún sismo cumplió", que es
    // cierto pero oculta la afirmación que se está evaluando.
    expect(sinCandidato.length).toBe(claims.length);
    for (const claim of sinCandidato) {
      expect(claim.eventTimeUtc).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});

describe("estado de una ventana abierta", () => {
  test("sin reclamo no se dice nada más que pendiente", async () => {
    const prediction = await getPrediction("W20260817-P2");
    if (!prediction) throw new Error("falta W20260817-P2");
    expect(openWindowState(null, prediction)).toBe("NO_CLAIM_YET");
  });

  test("un reclamo cuyas fuentes discrepan se marca dividido", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260817-P1");
    const prediction = await getPrediction("W20260817-P1");
    if (!claim || !prediction) throw new Error("falta W20260817-P1");
    // USGS 4.4 cae dentro de 4.1-4.5 y el IGP 4.8 queda fuera.
    expect(openWindowState(claim, prediction)).toBe("CLAIM_SOURCES_SPLIT");
  });

  test("un reclamo con todas las fuentes fuera del rango se marca como tal", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260817-P5");
    const prediction = await getPrediction("W20260817-P5");
    if (!claim || !prediction) throw new Error("falta W20260817-P5");
    // USGS 3.8 y SGC 4.8 caen fuera de 4.3-4.7, por lados opuestos.
    expect(openWindowState(claim, prediction)).toBe("CLAIM_OUTSIDE_RANGE");
  });
});

describe("procedencia de la cifra que publica la cuenta", () => {
  test("cada reclamo registra si la publicación cita una fuente", async () => {
    const claims = await loadClaimedValidations();
    for (const claim of claims) {
      const cited = claim.claimedSourceCited;
      expect(cited === null || typeof cited === "string").toBe(true);
    }
  });

  test("la mayoría de los reclamos no cita ninguna fuente oficial", async () => {
    const claims = await loadClaimedValidations();
    const sinFuente = claims.filter(
      (claim) => claim.claimedSourceCited === null,
    );
    // Nueve de diez publican una captura de una app de terceros sin nombrar
    // qué agencia calculó la magnitud. Si esto cambia, el hallazgo cambia.
    expect(sinFuente.length).toBeGreaterThanOrEqual(9);
  });

  test("toda lectura oficial trae la URL donde se comprueba", async () => {
    const claims = await loadClaimedValidations();
    for (const claim of claims) {
      for (const source of claim.sources) {
        expect(source.url).toMatch(/^https:\/\//);
      }
    }
  });
});

describe("consenso entre fuentes", () => {
  test("cuenta cuántas fuentes dejan el evento dentro del rango", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260817-P1");
    const prediction = await getPrediction("W20260817-P1");
    if (!claim || !prediction) throw new Error("falta W20260817-P1");
    const consenso = sourceConsensus(claim, prediction);
    // USGS 4.4 y EMSC 4.4 caen en 4.1-4.5; el IGP 4.8 no.
    expect(consenso.inside).toBe(2);
    expect(consenso.total).toBe(3);
    expect(consenso.minError).toBe(0);
    expect(consenso.maxError).toBe(0.3);
  });

  test("el veredicto sigue usando la fuente principal aunque la mayoría difiera", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260817-P1");
    const prediction = await getPrediction("W20260817-P1");
    if (!claim || !prediction) throw new Error("falta W20260817-P1");
    const consenso = sourceConsensus(claim, prediction);
    // Dos de tres fuentes dicen que entra, pero el protocolo manda IGP para el
    // Perú. Las dos lecturas se publican para que la decisión no quede oculta.
    expect(consenso.principalSourceId).toBe("igp-censis-catalogo");
    expect(consenso.principalError).toBe(0.3);
  });

  test("sin ninguna fuente dentro del rango el consenso lo refleja", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260817-P5");
    const prediction = await getPrediction("W20260817-P5");
    if (!claim || !prediction) throw new Error("falta W20260817-P5");
    expect(sourceConsensus(claim, prediction).inside).toBe(0);
  });
});

describe("error relativo al ancho del rango", () => {
  test("normaliza contra el ancho que la propia cuenta publicó", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260817-P1");
    const prediction = await getPrediction("W20260817-P1");
    if (!claim || !prediction) throw new Error("falta W20260817-P1");
    const consenso = sourceConsensus(claim, prediction);
    // Rango 4.1-4.5 mide 0.4 de ancho; el IGP yerra por 0.3.
    expect(consenso.rangeWidth).toBe(0.4);
    expect(consenso.principalErrorInWidths).toBe(0.75);
  });

  test("un error mayor que el propio rango supera 1", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260817-P5");
    const prediction = await getPrediction("W20260817-P5");
    if (!claim || !prediction) throw new Error("falta W20260817-P5");
    const consenso = sourceConsensus(claim, prediction);
    // 0.5 de error sobre un rango de 0.4 de ancho.
    expect(consenso.principalErrorInWidths).toBeGreaterThan(1);
  });

  test("un acierto no tiene error relativo", async () => {
    const claims = await loadClaimedValidations();
    const claim = claims.find((c) => c.predictionId === "W20260810-P6");
    const prediction = await getPrediction("W20260810-P6");
    if (!claim || !prediction) throw new Error("falta W20260810-P6");
    expect(sourceConsensus(claim, prediction).principalErrorInWidths).toBe(0);
  });
});
