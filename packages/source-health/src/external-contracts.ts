import { z } from "zod";

export type ExternalContract =
  | "arcgis-latest"
  | "wfs-latest"
  | "instrumental"
  | "volcanoes"
  | "aceldat-reports"
  | "dspace"
  | "usgs"
  | "sgc-biweekly"
  | "censis-xlsx";

export interface ContractCheckResult {
  valid: boolean;
  recordCount: number | null;
  drift: string[];
  detail: string;
}

const latestProperties = z.object({
  fecha_local: z.string(),
  hora_local: z.string(),
  latitud: z.number(),
  longitud: z.number(),
  magnitud: z.number(),
  profundidad: z.number(),
  intensidad: z.string(),
  referencia: z.string(),
  epicentro: z.string().optional(),
  ubicacion: z.string().optional(),
});

const volcanoProperties = z.object({
  objectid: z.number(),
  longitud: z.number(),
  latitud: z.number(),
  nivel: z.string(),
  alerta: z.string(),
  region: z.string(),
  resena: z.string(),
  volcan: z.string(),
  name: z.string(),
});

const instrumentalProperties = z.object({
  fecha_utc: z.string(),
  hora_utc: z.string(),
  profundidad: z.number(),
  magnitud: z.number(),
  epicentro: z.string(),
  clasificacion: z.string(),
  latitud: z.number(),
  longitud: z.number(),
  year: z.number(),
});

function featureCollectionSchema(properties: z.ZodObject) {
  return z.object({
    type: z.literal("FeatureCollection"),
    features: z
      .array(
        z.object({
          geometry: z
            .object({
              type: z.string(),
              coordinates: z.array(z.number()).min(2),
            })
            .nullable(),
          properties,
        }),
      )
      .min(1),
  });
}

const aceldatReportsSchema = z
  .array(
    z.object({
      _id: z.string(),
      numeroReporte: z.number(),
      fechaHora: z.object({
        $date: z.object({ $numberLong: z.union([z.number(), z.string()]) }),
      }),
      magnitud: z.number(),
      referencia: z.string(),
    }),
  )
  .min(1);

const dspaceSchema = z.object({
  _embedded: z.object({
    searchResult: z.object({
      page: z.object({ totalElements: z.number() }),
    }),
  }),
});

const usgsSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      id: z.string(),
      properties: z.object({
        mag: z.number().nullable(),
        place: z.string().nullable(),
        time: z.number(),
        type: z.string(),
      }),
      geometry: z.object({ coordinates: z.array(z.number()).length(3) }),
    }),
  ),
});

const sgcBiweeklySchema = z.object({
  type: z.literal("FeatureCollection"),
  metadata: z.object({ count: z.number() }),
  features: z.array(
    z.object({
      id: z.string(),
      type: z.literal("Feature"),
      properties: z.object({
        status: z.string(),
        type: z.string(),
        magType: z.string(),
        agency: z.string(),
        utcTime: z.string(),
        localTime: z.string(),
        place: z.string(),
        mag: z.number(),
        mmi: z.number().nullable(),
        depth: z.number(),
      }),
      geometry: z.object({
        type: z.literal("Point"),
        coordinates: z.array(z.number()).length(3),
      }),
    }),
  ),
});

export const CENSIS_EXPECTED_HEADER = [
  "fecha UTC",
  "hora UTC",
  "latitud (º)",
  "longitud (º)",
  "profundidad (km)",
  "magnitud (M)",
];

interface ContractSpec {
  schema: z.ZodType;
  countRecords: (payload: unknown) => number | null;
  knownKeys: string[] | null;
  sampleKeys: (payload: unknown) => string[] | null;
}

function fcSpec(
  properties: z.ZodObject,
  extraKnownKeys: string[] = [],
): ContractSpec {
  return {
    schema: featureCollectionSchema(properties),
    countRecords: (payload) => {
      const features = (payload as { features?: unknown[] })?.features;
      return Array.isArray(features) ? features.length : null;
    },
    knownKeys: [...Object.keys(properties.shape), ...extraKnownKeys],
    sampleKeys: (payload) => {
      const first = (payload as { features?: Array<{ properties?: object }> })
        ?.features?.[0]?.properties;
      return first ? Object.keys(first) : null;
    },
  };
}

const CONTRACTS: Record<
  Exclude<ExternalContract, "censis-xlsx">,
  ContractSpec
> = {
  "arcgis-latest": fcSpec(latestProperties, ["objectid"]),
  "wfs-latest": fcSpec(latestProperties),
  instrumental: fcSpec(instrumentalProperties),
  volcanoes: fcSpec(volcanoProperties),
  "aceldat-reports": {
    schema: aceldatReportsSchema,
    countRecords: (payload) => (Array.isArray(payload) ? payload.length : null),
    knownKeys: ["_id", "numeroReporte", "fechaHora", "magnitud", "referencia"],
    sampleKeys: (payload) =>
      Array.isArray(payload) && payload[0] && typeof payload[0] === "object"
        ? Object.keys(payload[0] as object)
        : null,
  },
  dspace: {
    schema: dspaceSchema,
    countRecords: (payload) =>
      (
        payload as {
          _embedded?: { searchResult?: { page?: { totalElements?: number } } };
        }
      )?._embedded?.searchResult?.page?.totalElements ?? null,
    knownKeys: null,
    sampleKeys: () => null,
  },
  usgs: {
    schema: usgsSchema,
    countRecords: (payload) => {
      const features = (payload as { features?: unknown[] })?.features;
      return Array.isArray(features) ? features.length : null;
    },
    knownKeys: null,
    sampleKeys: () => null,
  },
  "sgc-biweekly": {
    schema: sgcBiweeklySchema,
    countRecords: (payload) => {
      const features = (payload as { features?: unknown[] })?.features;
      return Array.isArray(features) ? features.length : null;
    },
    knownKeys: null,
    sampleKeys: () => null,
  },
};

function zodIssuesToDrift(error: z.ZodError): string[] {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "(raíz)"}: ${issue.message}`);
}

export function checkExternalContract(
  contract: ExternalContract,
  payload: unknown,
): ContractCheckResult {
  if (contract === "censis-xlsx") {
    throw new Error(
      "censis-xlsx se valida con checkCensisHeader sobre las filas del XLSX",
    );
  }
  const spec = CONTRACTS[contract];
  const result = spec.schema.safeParse(payload);
  const recordCount = spec.countRecords(payload);
  const drift: string[] = [];

  if (!result.success) {
    drift.push(
      ...zodIssuesToDrift(result.error).map((issue) => `ROTO ${issue}`),
    );
  }
  if (spec.knownKeys) {
    const observed = spec.sampleKeys(payload);
    if (observed) {
      const extra = observed.filter(
        (key) => !(spec.knownKeys as string[]).includes(key),
      );
      if (extra.length > 0) {
        drift.push(`NUEVO campo(s) no contemplado(s): ${extra.join(", ")}`);
      }
    }
  }

  return {
    valid: result.success,
    recordCount,
    drift,
    detail: result.success
      ? drift.length > 0
        ? `Contrato válido con novedades: ${drift.join(" · ")}`
        : `Contrato válido (${recordCount ?? "?"} registros)`
      : `Contrato ROTO: ${drift.join(" · ")}`,
  };
}

export function checkCensisHeader(rows: string[][]): ContractCheckResult {
  const header = rows[0] ?? [];
  const missing = CENSIS_EXPECTED_HEADER.filter(
    (column) => !header.includes(column),
  );
  const extra = header.filter(
    (column) => !CENSIS_EXPECTED_HEADER.includes(column),
  );
  const drift = [
    ...missing.map((column) => `ROTO columna ausente: ${column}`),
    ...extra.map((column) => `NUEVO columna: ${column}`),
  ];
  const valid = missing.length === 0;
  return {
    valid,
    recordCount: Math.max(rows.length - 1, 0),
    drift,
    detail: valid
      ? drift.length > 0
        ? `XLSX válido con novedades: ${drift.join(" · ")}`
        : `XLSX válido (${rows.length - 1} filas)`
      : `XLSX ROTO: ${drift.join(" · ")}`,
  };
}
