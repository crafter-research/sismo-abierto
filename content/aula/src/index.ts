export type ClaimClass = "explanation" | "official-cited";

export interface LessonClaim {
  text: string;
  classification: ClaimClass;
  sourceName: string | null;
  sourceUrl: string | null;
}

export interface LessonQuestion {
  prompt: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  feedbackCorrect: string;
  feedbackIncorrect: string;
}

export interface Lesson {
  slug: string;
  title: string;
  summary: string;
  version: string;
  reviewStatus: "pendiente-de-revision";
  claims: LessonClaim[];
  question: LessonQuestion;
  sources: Array<{ name: string; url: string }>;
}

export const LESSONS: Lesson[] = [
  {
    slug: "magnitud-no-es-intensidad",
    title: "Magnitud no es intensidad",
    summary:
      "La magnitud mide la energía liberada por el sismo; la intensidad describe cómo se sintió en cada lugar.",
    version: "1.0.0",
    reviewStatus: "pendiente-de-revision",
    claims: [
      {
        text: "La magnitud es una medida instrumental de la energía liberada en la fuente del sismo. Cada evento tiene una sola magnitud.",
        classification: "explanation",
        sourceName: "USGS: Magnitude / Intensity",
        sourceUrl:
          "https://www.usgs.gov/programs/earthquake-hazards/magnitude-intensity",
      },
      {
        text: "La intensidad describe los efectos observados en un lugar específico. Un mismo sismo tiene intensidades distintas en distintas ciudades.",
        classification: "explanation",
        sourceName: "USGS: Magnitude / Intensity",
        sourceUrl:
          "https://www.usgs.gov/programs/earthquake-hazards/magnitude-intensity",
      },
      {
        text: 'El IGP reporta la intensidad junto a una referencia de lugar (por ejemplo, "IV-V Chupaca"): esa es la intensidad percibida cerca del epicentro, no en todo el país.',
        classification: "explanation",
        sourceName: "IGP · CENSIS",
        sourceUrl: "https://ultimosismo.igp.gob.pe/",
      },
      {
        text: "La aceleración registrada por cada estación (PGA) disminuye en general con la distancia al epicentro, y también depende del suelo local.",
        classification: "explanation",
        sourceName: "IGP · ACELDAT-PERÚ",
        sourceUrl:
          "https://www.igp.gob.pe/servicios/aceldat-peru/informacion-acelerometrica",
      },
    ],
    question: {
      prompt: "¿Qué valor puede cambiar según la ubicación de quien lo mide?",
      options: [
        { id: "magnitud", text: "La magnitud" },
        { id: "intensidad", text: "La intensidad" },
      ],
      correctOptionId: "intensidad",
      feedbackCorrect:
        "Correcto. La magnitud es una sola por evento; la intensidad depende de dónde estás: distancia al epicentro, profundidad y suelo local.",
      feedbackIncorrect:
        "No exactamente. La magnitud es una propiedad del evento (una sola por sismo). Lo que cambia con la ubicación es la intensidad: qué tan fuerte se sintió en cada lugar.",
    },
    sources: [
      {
        name: "USGS: Magnitude / Intensity",
        url: "https://www.usgs.gov/programs/earthquake-hazards/magnitude-intensity",
      },
      { name: "IGP · Último sismo", url: "https://ultimosismo.igp.gob.pe/" },
      {
        name: "IGP · ACELDAT-PERÚ",
        url: "https://www.igp.gob.pe/servicios/aceldat-peru/informacion-acelerometrica",
      },
    ],
  },
];

export function getLesson(slug: string): Lesson | null {
  return LESSONS.find((lesson) => lesson.slug === slug) ?? null;
}
