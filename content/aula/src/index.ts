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
  eventPrompt: string;
  showLaboratory: boolean;
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
    eventPrompt:
      "Este evento tiene registros acelerométricos: al abrirlo verás que la magnitud es una sola, pero cada estación registró aceleraciones distintas.",
    showLaboratory: true,
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
  {
    slug: "profundidad-distancia-y-sacudida",
    title: "Profundidad, distancia y sacudida",
    summary:
      "La profundidad ubica el foco bajo la superficie; la distancia epicentral separa una estación del epicentro. Ninguna explica por sí sola toda la sacudida.",
    eventPrompt:
      "Abre el evento para observar su profundidad y las distancias epicentrales de sus estaciones. Luego compara dos registros del mismo sismo en el laboratorio.",
    showLaboratory: true,
    version: "1.0.0",
    reviewStatus: "pendiente-de-revision",
    claims: [
      {
        text: "La profundidad indica qué tan abajo de la superficie se ubica el foco donde comenzó la ruptura. No es una distancia a la ciudad de referencia.",
        classification: "explanation",
        sourceName: "IGP · CENSIS · Reporte sísmico",
        sourceUrl: "https://ultimosismo.igp.gob.pe/evento/2026-0303",
      },
      {
        text: "La distancia epicentral mide la separación sobre la superficie entre el epicentro y la estación. ACELDAT publica este valor para cada registro.",
        classification: "explanation",
        sourceName: "IGP · ACELDAT-PERÚ · Registro SCHYO",
        sourceUrl:
          "https://www.igp.gob.pe/servicios/api-acelerometrica/ran/file/20260468_20260719_022434_SCHYO_SC.txt",
      },
      {
        text: "En general la sacudida disminuye al aumentar la distancia, pero también influyen la magnitud, la profundidad, la dirección de la ruptura y las condiciones locales del suelo.",
        classification: "explanation",
        sourceName: "USGS · DYFI Scientific Background",
        sourceUrl: "https://earthquake.usgs.gov/data/dyfi/background.php",
      },
      {
        text: "Que una estación esté más cerca no garantiza por sí solo que registre el PGA más alto. Los registros reales permiten comprobar cuándo el patrón general se cumple y cuándo intervienen otros factores.",
        classification: "explanation",
        sourceName: "IGP · ACELDAT-PERÚ",
        sourceUrl:
          "https://www.igp.gob.pe/servicios/aceldat-peru/reportes-registros-acelerometricos",
      },
    ],
    question: {
      prompt:
        "Dos estaciones registran el mismo sismo. ¿La más cercana debe tener siempre el PGA más alto?",
      options: [
        { id: "si", text: "Sí, la distancia lo determina por completo" },
        {
          id: "no",
          text: "No, la distancia influye pero no es el único factor",
        },
      ],
      correctOptionId: "no",
      feedbackCorrect:
        "Correcto. La distancia importa, pero el suelo local, la profundidad y la propagación de la ruptura también cambian lo que registra cada estación.",
      feedbackIncorrect:
        "No necesariamente. La distancia describe una parte del problema; los registros pueden variar por profundidad, suelo local y dirección de la ruptura.",
    },
    sources: [
      {
        name: "IGP · CENSIS · Reporte sísmico",
        url: "https://ultimosismo.igp.gob.pe/evento/2026-0303",
      },
      {
        name: "IGP · ACELDAT-PERÚ · Registro SCHYO",
        url: "https://www.igp.gob.pe/servicios/api-acelerometrica/ran/file/20260468_20260719_022434_SCHYO_SC.txt",
      },
      {
        name: "USGS · DYFI Scientific Background",
        url: "https://earthquake.usgs.gov/data/dyfi/background.php",
      },
    ],
  },
  {
    slug: "componentes-z-n-e-y-pga",
    title: "Qué representan Z, N, E y PGA",
    summary:
      "Un acelerómetro registra el movimiento en tres direcciones. El PGA resume el pico de aceleración de cada componente.",
    eventPrompt:
      "Abre una estación del evento para ver las tres series, sus unidades y el PGA oficial junto al valor recalculado sobre la serie completa.",
    showLaboratory: true,
    version: "1.0.0",
    reviewStatus: "pendiente-de-revision",
    claims: [
      {
        text: "En los archivos de ACELDAT, Z es la componente vertical, N la componente norte-sur y E la componente este-oeste.",
        classification: "explanation",
        sourceName: "IGP · ACELDAT-PERÚ · Registro SCHYO",
        sourceUrl:
          "https://www.igp.gob.pe/servicios/api-acelerometrica/ran/file/20260468_20260719_022434_SCHYO_SC.txt",
      },
      {
        text: "Cada fila contiene la aceleración medida en esas tres direcciones. En el registro de ejemplo, la unidad publicada es cm/s² y el muestreo es de 200 muestras por segundo.",
        classification: "explanation",
        sourceName: "IGP · ACELDAT-PERÚ · Registro SCHYO",
        sourceUrl:
          "https://www.igp.gob.pe/servicios/api-acelerometrica/ran/file/20260468_20260719_022434_SCHYO_SC.txt",
      },
      {
        text: "PGA significa aceleración máxima del suelo. Es un pico de movimiento registrado en un lugar, no la magnitud del sismo ni una intensidad sentida por toda una ciudad.",
        classification: "explanation",
        sourceName: "USGS · Earthquake Hazards 201",
        sourceUrl:
          "https://www.usgs.gov/programs/earthquake-hazards/science/earthquake-hazards-201-technical-qa",
      },
      {
        text: "Sismo Abierto recalcula el PGA como el máximo absoluto de cada serie completa y lo muestra junto al valor del encabezado oficial. La reducción visual no se usa para esa métrica.",
        classification: "explanation",
        sourceName: "Sismo Abierto · parser verificable",
        sourceUrl:
          "https://github.com/crafter-research/sismo-abierto/blob/main/packages/waveforms/src/parser.ts",
      },
    ],
    question: {
      prompt: "¿Qué describe el PGA de una componente?",
      options: [
        { id: "magnitud", text: "La magnitud total del sismo" },
        {
          id: "pico",
          text: "El pico de aceleración registrado en esa dirección",
        },
        { id: "duracion", text: "La duración completa del sismo" },
      ],
      correctOptionId: "pico",
      feedbackCorrect:
        "Correcto. El PGA resume el pico de aceleración registrado por una componente en esa estación.",
      feedbackIncorrect:
        "No. El PGA es el pico de aceleración de una componente en una estación; no reemplaza la magnitud ni describe la duración completa.",
    },
    sources: [
      {
        name: "IGP · ACELDAT-PERÚ · Registro SCHYO",
        url: "https://www.igp.gob.pe/servicios/api-acelerometrica/ran/file/20260468_20260719_022434_SCHYO_SC.txt",
      },
      {
        name: "USGS · Earthquake Hazards 201",
        url: "https://www.usgs.gov/programs/earthquake-hazards/science/earthquake-hazards-201-technical-qa",
      },
      {
        name: "Sismo Abierto · parser verificable",
        url: "https://github.com/crafter-research/sismo-abierto/blob/main/packages/waveforms/src/parser.ts",
      },
    ],
  },
  {
    slug: "prediccion-pronostico-y-alerta-temprana",
    title: "Predicción, pronóstico y alerta temprana",
    summary:
      "Una predicción intenta anticipar un evento concreto; un pronóstico expresa probabilidades; una alerta temprana empieza después de iniciado el sismo.",
    eventPrompt:
      "Este evento fue publicado después de ocurrir. Un reporte rápido y trazable no es una predicción ni convierte este proyecto en un canal de alerta.",
    showLaboratory: false,
    version: "1.0.0",
    reviewStatus: "pendiente-de-revision",
    claims: [
      {
        text: "Una predicción sísmica concreta tendría que anticipar fecha y hora, ubicación y magnitud. La ciencia actual no puede predecir así los sismos.",
        classification: "explanation",
        sourceName: "USGS · Prediction, forecasts and early warning",
        sourceUrl:
          "https://www.usgs.gov/faqs/what-difference-between-earthquake-early-warning-earthquake-forecasts-earthquake-probabilities",
      },
      {
        text: "Un pronóstico expresa probabilidades dentro de una región y una ventana temporal. En plazos cortos se usa especialmente para secuencias de réplicas.",
        classification: "explanation",
        sourceName: "USGS · Prediction, forecasts and early warning",
        sourceUrl:
          "https://www.usgs.gov/faqs/what-difference-between-earthquake-early-warning-earthquake-forecasts-earthquake-probabilities",
      },
      {
        text: "Una alerta temprana se emite después de que el sismo ya comenzó: estaciones cercanas detectan las primeras ondas y la información puede llegar antes que la sacudida a lugares más lejanos.",
        classification: "explanation",
        sourceName: "USGS · Earthquake Early Warning",
        sourceUrl:
          "https://www.usgs.gov/programs/earthquake-hazards/science/earthquake-early-warning-fine-tuning-best-alerts",
      },
      {
        text: "El IGP recuerda que los sismos no se pueden predecir y es la entidad estatal que emite información sísmica oficial en el Perú. Sismo Abierto solo reutiliza datos públicos con procedencia.",
        classification: "explanation",
        sourceName: "IGP · CENSIS · Reporte sísmico",
        sourceUrl: "https://ultimosismo.igp.gob.pe/evento/2026-0303",
      },
    ],
    question: {
      prompt: "¿Cuál de estas opciones comienza después de iniciado el sismo?",
      options: [
        { id: "prediccion", text: "La predicción" },
        { id: "pronostico", text: "El pronóstico probabilístico" },
        { id: "alerta", text: "La alerta temprana" },
      ],
      correctOptionId: "alerta",
      feedbackCorrect:
        "Correcto. La alerta temprana detecta un sismo que ya empezó e intenta adelantar la llegada de la sacudida a otros lugares.",
      feedbackIncorrect:
        "No. La alerta temprana es la que comienza después del inicio del sismo; no intenta predecirlo antes de que ocurra.",
    },
    sources: [
      {
        name: "USGS · Prediction, forecasts and early warning",
        url: "https://www.usgs.gov/faqs/what-difference-between-earthquake-early-warning-earthquake-forecasts-earthquake-probabilities",
      },
      {
        name: "USGS · Earthquake Early Warning",
        url: "https://www.usgs.gov/programs/earthquake-hazards/science/earthquake-early-warning-fine-tuning-best-alerts",
      },
      {
        name: "IGP · CENSIS · Reporte sísmico",
        url: "https://ultimosismo.igp.gob.pe/evento/2026-0303",
      },
    ],
  },
];

export function getLesson(slug: string): Lesson | null {
  return LESSONS.find((lesson) => lesson.slug === slug) ?? null;
}
