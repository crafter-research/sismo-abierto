import { describe, expect, test } from "bun:test";
import { compareEvents, getLesson, LESSONS } from "../src/index.ts";

describe("contenido de Aula", () => {
  test("publica las cuatro lecciones del roadmap con slugs únicos", () => {
    expect(LESSONS).toHaveLength(4);
    expect(new Set(LESSONS.map((lesson) => lesson.slug)).size).toBe(4);
  });

  test("cada lección tiene fuentes y una respuesta válida", () => {
    for (const lesson of LESSONS) {
      expect(lesson.claims.length).toBeGreaterThanOrEqual(3);
      expect(lesson.sources.length).toBeGreaterThanOrEqual(2);
      expect(
        lesson.question.options.some(
          (option) => option.id === lesson.question.correctOptionId,
        ),
      ).toBe(true);
      expect(
        lesson.sources.every((source) => source.url.startsWith("https://")),
      ).toBe(true);
    }
  });

  test("getLesson resuelve cada slug y rechaza desconocidos", () => {
    for (const lesson of LESSONS) {
      expect(getLesson(lesson.slug)?.title).toBe(lesson.title);
    }
    expect(getLesson("no-existe")).toBeNull();
  });
});

describe("comparador de eventos", () => {
  test("identifica el evento de mayor magnitud y el más superficial", () => {
    expect(
      compareEvents(
        { id: "a", magnitude: 5.1, depthKm: 18 },
        { id: "b", magnitude: 4.6, depthKm: 42 },
      ),
    ).toEqual({
      higherMagnitudeId: "a",
      shallowerId: "a",
      magnitudeDelta: 0.5,
      depthDeltaKm: 24,
    });
  });

  test("expresa empates sin inventar diferencias", () => {
    expect(
      compareEvents(
        { id: "a", magnitude: 5, depthKm: 20 },
        { id: "b", magnitude: 5, depthKm: 20 },
      ),
    ).toEqual({
      higherMagnitudeId: null,
      shallowerId: null,
      magnitudeDelta: 0,
      depthDeltaKm: 0,
    });
  });
});
