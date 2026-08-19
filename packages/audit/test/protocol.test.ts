import { describe, expect, test } from "bun:test";
import type { FrozenPrediction } from "@sismo/contracts";
import {
  classifyVerdict,
  isInWindow,
  isMagnitudeInRange,
  loadClaimedValidations,
  loadHistoricalReportRegistry,
  loadPanoramaReportRegistry,
  loadPredictionRegistry,
  matchersForTarget,
  matchRegion,
  parseClaimedValidations,
  parseFrozenPredictions,
  type RawCandidate,
  type RegionMatcher,
  windowHasClosed,
} from "../src/index.ts";

const P1: FrozenPrediction = {
  predictionId: "P1",
  origin: "Michoacán, México",
  originMagnitude: 4.1,
  targetRegions: ["Ica", "Lima-Callao"],
  predictedMagnitudeMin: 3.9,
  predictedMagnitudeMax: 4.4,
  maxDays: 6,
  startDate: "2026-07-20",
  deadlineEndLima: "2026-07-26T23:59:59-05:00",
};

function candidate(overrides: Partial<RawCandidate>): RawCandidate {
  return {
    sourceId: "igp-censis-catalogo",
    eventTimeUtc: "2026-07-21T00:00:00Z",
    magnitude: 4.0,
    latitude: -14.0,
    longitude: -75.5,
    place: "Ica",
    matchedRegion: "Ica (departamento)",
    regionIsAmbiguous: false,
    match: "inside",
    sourceDisagreement: false,
    disagreementDetail: null,
    ...overrides,
  };
}

describe("registro congelado", () => {
  test("carga las 8 predicciones del CSV sin alterarlas", async () => {
    const registry = await loadPredictionRegistry();
    expect(registry.length).toBe(8);
    const p1 = registry[0];
    expect(p1?.predictionId).toBe("P1");
    expect(p1?.targetRegions).toEqual(["Ica", "Lima-Callao"]);
    expect(p1?.predictedMagnitudeMin).toBe(3.9);
    expect(p1?.deadlineEndLima).toBe("2026-07-26T23:59:59-05:00");
    expect(registry[5]?.deadlineEndLima).toBe("2026-08-01T23:59:59-05:00");
  });

  test("un header distinto al congelado se rechaza", () => {
    expect(() => parseFrozenPredictions("otra,cosa\n1,2")).toThrow(
      "header esperado",
    );
  });

  test("conserva la validación reclamada sin convertirla en resultado", async () => {
    const claims = await loadClaimedValidations();
    const huayucachi = claims.find(
      (claim) => claim.predictionId === "W20260803-P2",
    );
    expect(huayucachi?.sources.map((source) => source.magnitude)).toEqual([
      5.0, 5.3,
    ]);
    expect(huayucachi?.assessment).toBe("OUTSIDE_FROZEN_MAGNITUDE");
  });

  test("un reclamo fuera de la geografía congelada se conserva como tal", async () => {
    const claims = await loadClaimedValidations();
    const colombia = claims.find((claim) => claim.predictionId === "R255-P2");
    expect(colombia?.assessment).toBe("OUTSIDE_FROZEN_GEOGRAPHY");
    expect(colombia?.latitude).toBeLessThan(8);
  });

  test("un reclamo sin registro oficial se conserva como no verificable", async () => {
    const claims = await loadClaimedValidations();
    const sinRegistro = claims.find(
      (claim) => claim.predictionId === "W20260803-P5",
    );
    expect(sinRegistro?.assessment).toBe("UNVERIFIABLE_IN_OFFICIAL_SOURCES");
  });

  test("cada reclamo conserva la magnitud que la cuenta publicó", async () => {
    const claims = await loadClaimedValidations();
    for (const claim of claims) {
      expect(typeof claim.claimedMagnitude).toBe("number");
      expect(typeof claim.claimedMagnitudeScale).toBe("string");
    }
  });

  test("la magnitud publicada se conserva aunque no coincida con ninguna fuente", async () => {
    const claims = await loadClaimedValidations();
    const lurin = claims.find((claim) => claim.predictionId === "W20260817-P1");
    expect(lurin?.claimedMagnitude).toBe(4.6);
    const oficiales = lurin?.sources.map((source) => source.magnitude) ?? [];
    // Se afirma el hecho, no la lista: agregar una fuente de contraste no debe
    // romper este test, pero sí debe seguir sin producir un 4.6.
    expect(oficiales.length).toBeGreaterThanOrEqual(2);
    expect(oficiales.includes(lurin?.claimedMagnitude ?? 0)).toBe(false);
  });

  test("todo reclamo apunta a una afirmación que existe en algún registro", async () => {
    const claims = await loadClaimedValidations();
    const panoramas = await loadPanoramaReportRegistry();
    const historicos = await loadHistoricalReportRegistry();
    const conocidos = new Set<string>();
    for (const panorama of panoramas) {
      for (const point of panorama.points) conocidos.add(point.predictionId);
    }
    for (const informe of historicos) {
      for (const point of informe.points) {
        conocidos.add(`R${informe.reportNumber}-P${point.pointNumber}`);
      }
    }
    for (const claim of claims) {
      expect(conocidos.has(claim.predictionId)).toBe(true);
    }
  });

  test("rechaza una validación reclamada sin fuentes oficiales", () => {
    expect(() =>
      parseClaimedValidations([
        {
          predictionId: "W20260803-P2",
          claimText: "Proyección cumplida",
          sourcePublishedAtLima: "2026-08-06T10:00:00-05:00",
          eventTimeUtc: "2026-08-06T18:57:18Z",
          sources: [],
          assessment: "OUTSIDE_FROZEN_MAGNITUDE",
        },
      ]),
    ).toThrow("formato esperado");
  });
});

describe("fronteras de magnitud (inclusivas)", () => {
  test("ambos extremos del intervalo cuentan", () => {
    expect(isMagnitudeInRange(P1, 3.9)).toBe(true);
    expect(isMagnitudeInRange(P1, 4.4)).toBe(true);
    expect(isMagnitudeInRange(P1, 4.15)).toBe(true);
  });
  test("fuera del intervalo no cuenta", () => {
    expect(isMagnitudeInRange(P1, 3.89)).toBe(false);
    expect(isMagnitudeInRange(P1, 4.41)).toBe(false);
  });
});

describe("fronteras de tiempo (hora de origen, Lima)", () => {
  test("el inicio de la ventana es inclusivo", () => {
    expect(isInWindow(P1, "2026-07-20T05:00:00Z")).toBe(true);
    expect(isInWindow(P1, "2026-07-20T04:59:59Z")).toBe(false);
  });
  test("el final de la ventana es inclusivo al segundo congelado", () => {
    expect(isInWindow(P1, "2026-07-27T04:59:59Z")).toBe(true);
    expect(isInWindow(P1, "2026-07-27T05:00:00Z")).toBe(false);
  });
  test("windowHasClosed usa el deadline congelado", () => {
    expect(windowHasClosed(P1, Date.parse("2026-07-27T04:59:58Z"))).toBe(false);
    expect(windowHasClosed(P1, Date.parse("2026-07-27T05:00:01Z"))).toBe(true);
  });
});

describe("geografía determinista", () => {
  const ica = matchersForTarget("Ica")[0] as RegionMatcher;
  test("interior claro del departamento (Ica ciudad)", () => {
    expect(matchRegion(ica, -14.07, -75.73)).toBe("inside");
  });
  test("epicentro a menos de 0.25° del límite es frontera, no acierto (Nazca)", () => {
    expect(matchRegion(ica, -14.83, -74.94)).toBe("boundary");
  });
  test("fuera del departamento (Cusco ciudad)", () => {
    expect(matchRegion(ica, -13.52, -71.97)).toBe("outside");
  });
  test("el borde interno de una unión no es frontera (Callao ciudad en Lima-Callao)", () => {
    const limaCallao = matchersForTarget("Lima-Callao")[0] as RegionMatcher;
    expect(matchRegion(limaCallao, -12.06, -77.13)).toBe("inside");
  });
  test("un destino resuelto a departamentos usa polígonos oficiales", () => {
    for (const target of [
      "Perú central",
      "Arequipa-Tacna",
      "frontera Cusco-Puno",
    ]) {
      const matchers = matchersForTarget(target);
      expect(matchers.length).toBeGreaterThan(0);
      for (const matcher of matchers) {
        expect(matcher.kind).toBe("peru-department");
        expect(matcher.departments?.length).toBeGreaterThan(0);
      }
    }
  });

  test("un destino solo se resuelve en la mitad que la fuente define", () => {
    const matchers = matchersForTarget("norte de Perú y sur de Ecuador");
    expect(matchers.some((m) => m.kind === "peru-department")).toBe(true);
    expect(matchers.some((m) => m.kind === "vague")).toBe(true);
  });

  test("las zonas vagas no reciben frontera inventada", () => {
    const vagueMatcher = matchersForTarget(
      "Chile central y frontera con Argentina",
    )[0] as RegionMatcher;
    expect(vagueMatcher?.kind).toBe("vague");
    expect(matchRegion(vagueMatcher, -12.0, -75.0)).toBe("vague");
  });
  test("todo destino congelado tiene mapeo", async () => {
    const registry = await loadPredictionRegistry();
    for (const prediction of registry) {
      for (const target of prediction.targetRegions) {
        const matchers = matchersForTarget(target);
        expect(matchers.length).toBeGreaterThan(0);
        for (const matcher of matchers) {
          expect(matcher.key.startsWith("sin-mapa-")).toBe(false);
        }
      }
    }
  });
  test("todo destino histórico tiene mapeo", async () => {
    const reports = await loadHistoricalReportRegistry();
    expect(reports.length).toBeGreaterThanOrEqual(11);
    expect(reports.flatMap((report) => report.points).length).toBe(
      reports.length * 4,
    );
    for (const report of reports) {
      for (const point of report.points) {
        for (const target of point.targetRegions) {
          const matchers = matchersForTarget(target);
          expect(matchers.length).toBeGreaterThan(0);
          expect(
            matchers.some((matcher) => matcher.key.startsWith("sin-mapa-")),
          ).toBe(false);
        }
      }
    }
  });
  test("todo destino de los panoramas semanales tiene mapeo", async () => {
    const reports = await loadPanoramaReportRegistry();
    expect(reports.length).toBeGreaterThanOrEqual(8);
    expect(
      reports.flatMap((report) => report.points).length,
    ).toBeGreaterThanOrEqual(58);
    expect(
      reports.filter((report) => report.registrationMode === "PROSPECTIVE")
        .length,
    ).toBeGreaterThanOrEqual(3);
    for (const report of reports) {
      for (const point of report.points) {
        for (const target of point.targetRegions) {
          const matchers = matchersForTarget(target);
          expect(matchers.length).toBeGreaterThan(0);
          expect(
            matchers.some((matcher) => matcher.key.startsWith("sin-mapa-")),
          ).toBe(false);
        }
      }
    }
  });
  test("el evento mar afuera de Puerto Rico queda como frontera", () => {
    const puertoRico = matchersForTarget(
      "República Dominicana o Puerto Rico",
    ).find((matcher) => matcher.key === "puerto-rico") as RegionMatcher;
    expect(matchRegion(puertoRico, 18.9423, -67.2968)).toBe("boundary");
  });
  test("un evento de Mindanao no se clasifica como Indonesia", () => {
    const matchers = matchersForTarget(
      "Islas Sandwich, Indonesia o Papúa Nueva Guinea",
    ).filter((matcher) => matcher.label.startsWith("Indonesia"));
    expect(matchers.length).toBeGreaterThan(1);
    expect(
      matchers.every(
        (matcher) => matchRegion(matcher, 5.5994, 125.056) === "outside",
      ),
    ).toBe(true);
  });
  test("un evento en Colombia no se clasifica como Venezuela", () => {
    const venezuela = matchersForTarget("Norte de Colombia o Venezuela").find(
      (matcher) => matcher.key === "venezuela",
    ) as RegionMatcher;
    expect(matchRegion(venezuela, 6.1, -73.1)).toBe("outside");
  });
});

describe("clasificación de veredictos", () => {
  test("ventana abierta es PENDING aunque exista candidato estricto", () => {
    expect(
      classifyVerdict({
        windowClosed: false,
        candidates: [candidate({})],
        allTargetsVague: false,
      }),
    ).toBe("PENDING");
  });

  test("candidato estricto tras el cierre es STRICT_HIT", () => {
    expect(
      classifyVerdict({
        windowClosed: true,
        candidates: [candidate({})],
        allTargetsVague: false,
      }),
    ).toBe("STRICT_HIT");
  });

  test("desacuerdo de fuentes domina sobre ambigüedad", () => {
    expect(
      classifyVerdict({
        windowClosed: true,
        candidates: [
          candidate({ sourceDisagreement: true }),
          candidate({ match: "boundary", regionIsAmbiguous: true }),
        ],
        allTargetsVague: false,
      }),
    ).toBe("SOURCE_DISAGREEMENT");
  });

  test("solo coincidencias de frontera son AMBIGUOUS_GEOGRAPHY", () => {
    expect(
      classifyVerdict({
        windowClosed: true,
        candidates: [candidate({ match: "boundary", regionIsAmbiguous: true })],
        allTargetsVague: false,
      }),
    ).toBe("AMBIGUOUS_GEOGRAPHY");
  });

  test("todos los destinos vagos sin candidatos es AMBIGUOUS_GEOGRAPHY, no NO_MATCH", () => {
    expect(
      classifyVerdict({
        windowClosed: true,
        candidates: [],
        allTargetsVague: true,
      }),
    ).toBe("AMBIGUOUS_GEOGRAPHY");
  });

  test("sin candidatos en destinos inequívocos es NO_MATCH", () => {
    expect(
      classifyVerdict({
        windowClosed: true,
        candidates: [],
        allTargetsVague: false,
      }),
    ).toBe("NO_MATCH");
  });
  test("una parte territorial vaga impide declarar NO_MATCH", () => {
    expect(
      classifyVerdict({
        windowClosed: true,
        candidates: [],
        allTargetsVague: false,
        hasVagueTargets: true,
      }),
    ).toBe("AMBIGUOUS_GEOGRAPHY");
  });
});
