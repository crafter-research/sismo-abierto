import { describe, expect, test } from "bun:test";
import { getLesson, LESSONS } from "../src/index.ts";

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
