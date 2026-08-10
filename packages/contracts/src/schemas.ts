import { z } from "zod";

export const sourceRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
});

export const provenanceSchema = z.object({
  source: sourceRefSchema,
  fetchedAt: z.string(),
  timezone: z.string(),
  sourceUpdatedAt: z.string().nullable(),
  freshness: z.enum(["FRESH", "STALE", "FRESHNESS_UNKNOWN"]),
  classification: z.enum(["official", "derived", "explanation", "unavailable"]),
  note: z.string().optional(),
});

export const normalizedEventSchema = z.object({
  id: z.string(),
  sourceEventId: z.string().optional(),
  agency: z.string().optional(),
  reviewStatus: z.string().optional(),
  magnitudeType: z.string().optional(),
  timeUtc: z.string().nullable(),
  timeLocal: z.string().nullable(),
  magnitude: z.number(),
  depthKm: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  reference: z.string().nullable(),
  intensity: z.string().nullable(),
  aceldatReportNumber: z.number().nullable(),
  provenance: provenanceSchema,
  fieldClasses: z.record(
    z.string(),
    z.enum(["official", "derived", "explanation", "unavailable"]),
  ),
});

export const eventStationSchema = z.object({
  code: z.string(),
  network: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  kind: z.enum(["acc", "sis"]),
  order: z.number(),
  epicentralDistanceKm: z.number().nullable(),
  hasWaveform: z.boolean(),
  officialPga: z
    .object({ z: z.number(), n: z.number(), e: z.number() })
    .nullable(),
  provenance: provenanceSchema,
});

export const waveformHeaderSchema = z.object({
  stationName: z.string(),
  stationCode: z.string(),
  stationLatitude: z.number(),
  stationLongitude: z.number(),
  eventDateLocal: z.string(),
  eventTimeLocal: z.string(),
  eventLatitude: z.number(),
  eventLongitude: z.number(),
  eventDepthKm: z.number(),
  eventMagnitude: z.number(),
  epicentralDistanceKm: z.number(),
  startTimeUtc: z.string(),
  sampleCount: z.number(),
  sampleRateHz: z.number(),
  units: z.string(),
  baselineCorrected: z.boolean(),
  pga: z.object({ z: z.number(), n: z.number(), e: z.number() }),
});

export const waveformViewSchema = z.object({
  eventId: z.string(),
  stationId: z.string(),
  header: waveformHeaderSchema,
  computedPga: z.object({ z: z.number(), n: z.number(), e: z.number() }),
  computedOverFullSeries: z.boolean(),
  reducedComponents: z.object({
    z: z.array(z.number()),
    n: z.array(z.number()),
    e: z.array(z.number()),
  }),
  frequencyAnalysis: z
    .object({
      spectrum: z.object({
        windowSizeSamples: z.number(),
        overlapSamples: z.number(),
        frequencyResolutionHz: z.number(),
        amplitudeUnit: z.string(),
        frequenciesHz: z.array(z.number()),
        amplitudes: z.object({
          z: z.array(z.number()),
          n: z.array(z.number()),
          e: z.array(z.number()),
        }),
      }),
      spectrogram: z.object({
        windowSizeSamples: z.number(),
        overlapSamples: z.number(),
        timeResolutionSeconds: z.number(),
        frequencyResolutionHz: z.number(),
        powerUnit: z.literal("dB rel."),
        minDb: z.number(),
        maxDb: z.number(),
        timesSeconds: z.array(z.number()),
        frequenciesHz: z.array(z.number()),
        powerDb: z.object({
          z: z.array(z.array(z.number())),
          n: z.array(z.array(z.number())),
          e: z.array(z.array(z.number())),
        }),
      }),
    })
    .optional(),
  reductionFactor: z.number(),
  sourceFileUrl: z.string(),
  provenance: provenanceSchema,
});

export const volcanoRecordSchema = z.object({
  slug: z.string(),
  name: z.string(),
  region: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  publishedLevel: z.string(),
  publishedActivity: z.string(),
  publishedReview: z.string(),
  objectId: z.number(),
  provenance: provenanceSchema,
});

export const sourceStatusSchema = z.enum([
  "OPERATIONAL",
  "DEGRADED",
  "UNAVAILABLE",
  "SCHEMA_CHANGED",
  "FRESHNESS_UNKNOWN",
]);

export const sourceStateResponseSchema = z.object({
  sourceId: z.string(),
  source: sourceRefSchema,
  status: sourceStatusSchema,
  lastCheckAt: z.string().nullable(),
  latencyMs: z.number().nullable(),
  disclaimer: z.string(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "SOURCE_UNAVAILABLE",
      "SOURCE_SCHEMA_CHANGED",
      "NOT_FOUND",
      "INVALID_INPUT",
      "PROVIDER_DISABLED",
      "INTERNAL",
    ]),
    message: z.string(),
    sourceId: z.string().nullable(),
  }),
});

export const latestEventResponseSchema = z.object({
  event: normalizedEventSchema,
  limitations: z.array(z.string()),
});

export const eventListResponseSchema = z.object({
  events: z.array(normalizedEventSchema),
  filters: z.object({
    provider: z.enum(["igp", "sgc"]).optional(),
    since: z.string().nullable(),
    until: z.string().nullable(),
    minMagnitude: z.number().nullable(),
    maxMagnitude: z.number().nullable(),
  }),
  provenance: provenanceSchema,
  limitations: z.array(z.string()),
});

export const eventDetailResponseSchema = z.object({
  event: normalizedEventSchema,
  limitations: z.array(z.string()),
});

export const stationListResponseSchema = z.object({
  eventId: z.string(),
  stations: z.array(eventStationSchema),
  provenance: provenanceSchema,
  limitations: z.array(z.string()),
});

export const waveformResponseSchema = z.object({
  waveform: waveformViewSchema,
  limitations: z.array(z.string()),
});

export const volcanoListResponseSchema = z.object({
  volcanoes: z.array(volcanoRecordSchema),
  freshness: z.literal("FRESHNESS_UNKNOWN"),
  provenance: provenanceSchema,
  limitations: z.array(z.string()),
});

export const volcanoDetailResponseSchema = z.object({
  volcano: volcanoRecordSchema,
  freshness: z.literal("FRESHNESS_UNKNOWN"),
  limitations: z.array(z.string()),
});

export const sourcesResponseSchema = z.object({
  sources: z.array(sourceStateResponseSchema),
  disclaimer: z.string(),
});

export const sourceDetailResponseSchema = z.object({
  source: sourceStateResponseSchema,
  recentChecks: z.array(
    z.object({
      checkedAt: z.string(),
      status: sourceStatusSchema,
      httpStatus: z.number().nullable(),
      durationMs: z.number(),
      evidence: z.string(),
    }),
  ),
  disclaimer: z.string(),
});

export const incidentFactSchema = z.object({
  key: z.string(),
  value: z.number(),
  displayValue: z.string(),
  label: z.string(),
});

export const incidentSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  reportNumber: z.string().nullable(),
  issuedAt: z.string(),
});

export const incidentRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  country: z.string(),
  countrySlug: z.string(),
  eventId: z.string(),
  title: z.string(),
  location: z.string(),
  startedAt: z.string(),
  status: z.enum(["active", "monitoring", "closed"]),
});

export const humanitarianSnapshotSchema = z.object({
  id: z.string(),
  versionLabel: z.string(),
  reviewStatus: z.literal("published"),
  observedAt: z.string(),
  publishedAt: z.string(),
  source: incidentSourceSchema,
  facts: z.array(incidentFactSchema),
});

export const incidentHistoryEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(["seismic", "humanitarian"]),
  versionLabel: z.string(),
  reviewStatus: z.enum(["automatic", "pending", "published", "rejected"]),
  observedAt: z.string(),
  publishedAt: z.string().nullable(),
  source: incidentSourceSchema,
});

export const incidentViewResponseSchema = z.object({
  incident: incidentRecordSchema,
  seismic: z
    .object({
      event: normalizedEventSchema,
      syncedAt: z.string(),
      freshness: z.enum(["FRESH", "DELAYED", "STALE", "UNKNOWN"]),
    })
    .nullable(),
  humanitarian: humanitarianSnapshotSchema,
  history: z.array(incidentHistoryEntrySchema),
  storage: z.enum(["database", "fallback"]),
  generatedAt: z.string(),
  limitations: z.array(z.string()),
});

export const humanitarianSubmissionSchema = z.object({
  versionLabel: z.string().min(1).max(80),
  observedAt: z.iso.datetime({ offset: true }),
  source: incidentSourceSchema,
  facts: z.array(incidentFactSchema).min(1),
});
