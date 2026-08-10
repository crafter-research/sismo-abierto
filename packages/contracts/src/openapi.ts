import { z } from "zod";
import {
  apiErrorSchema,
  eventDetailResponseSchema,
  eventListResponseSchema,
  latestEventResponseSchema,
  sourceDetailResponseSchema,
  sourcesResponseSchema,
  stationListResponseSchema,
  volcanoDetailResponseSchema,
  volcanoListResponseSchema,
  waveformResponseSchema,
} from "./schemas.ts";

interface EndpointSpec {
  path: string;
  summary: string;
  description: string;
  parameters: Array<{
    name: string;
    in: "path" | "query";
    required: boolean;
    description: string;
    schema: { type: string };
  }>;
  responseSchema: z.ZodType;
  responseName: string;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    path: "/v1/events/latest",
    summary: "Último sismo oficial",
    description:
      "Último evento publicado por el proveedor oficial seleccionado, normalizado con procedencia y frescura. SGC es experimental y puede estar deshabilitado por política de reutilización.",
    parameters: [
      {
        name: "provider",
        in: "query",
        required: false,
        description:
          "Proveedor oficial: igp (por defecto) o sgc. SGC requiere SISMO_SGC_PROVIDER=true.",
        schema: { type: "string" },
      },
    ],
    responseSchema: latestEventResponseSchema,
    responseName: "LatestEventResponse",
  },
  {
    path: "/v1/events",
    summary: "Catálogo de eventos",
    description:
      "Catálogo oficial filtrable por proveedor, fecha y magnitud. La consulta se hace en origen; no se redistribuye el dataset. SGC es experimental y puede estar deshabilitado por política de reutilización.",
    parameters: [
      {
        name: "provider",
        in: "query",
        required: false,
        description:
          "Proveedor oficial: igp (por defecto) o sgc. SGC requiere SISMO_SGC_PROVIDER=true.",
        schema: { type: "string" },
      },
      {
        name: "since",
        in: "query",
        required: false,
        description:
          "Fecha inicial ISO, duración tipo 7d o ytd para el año en curso. SGC admite hasta 366 días con minMagnitude >= 3.",
        schema: { type: "string" },
      },
      {
        name: "until",
        in: "query",
        required: false,
        description: "Fecha final ISO",
        schema: { type: "string" },
      },
      {
        name: "minMagnitude",
        in: "query",
        required: false,
        description:
          "Magnitud mínima. Es obligatoria con valor >= 3 para rangos SGC mayores a 31 días.",
        schema: { type: "number" },
      },
      {
        name: "maxMagnitude",
        in: "query",
        required: false,
        description: "Magnitud máxima",
        schema: { type: "number" },
      },
    ],
    responseSchema: eventListResponseSchema,
    responseName: "EventListResponse",
  },
  {
    path: "/v1/events/{eventId}",
    summary: "Detalle de un evento",
    description: "Evento normalizado con procedencia por campo.",
    parameters: [
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "ID interno estable del evento",
        schema: { type: "string" },
      },
    ],
    responseSchema: eventDetailResponseSchema,
    responseName: "EventDetailResponse",
  },
  {
    path: "/v1/events/{eventId}/stations",
    summary: "Estaciones que registraron el evento",
    description:
      "Estaciones ACELDAT (acelerométricas y sísmicas) asociadas al reporte del evento.",
    parameters: [
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "ID interno estable del evento",
        schema: { type: "string" },
      },
    ],
    responseSchema: stationListResponseSchema,
    responseName: "StationListResponse",
  },
  {
    path: "/v1/events/{eventId}/stations/{stationId}/waveform",
    summary: "Ondas de una estación",
    description:
      "Componentes Z, N y E con métricas calculadas sobre la serie completa, espectro de Fourier y espectrograma derivados, y reducción solo para visualización.",
    parameters: [
      {
        name: "eventId",
        in: "path",
        required: true,
        description: "ID interno estable del evento",
        schema: { type: "string" },
      },
      {
        name: "stationId",
        in: "path",
        required: true,
        description: "Código de estación, por ejemplo SCHYO",
        schema: { type: "string" },
      },
    ],
    responseSchema: waveformResponseSchema,
    responseName: "WaveformResponse",
  },
  {
    path: "/v1/volcanoes",
    summary: "Volcanes publicados",
    description:
      "Los 16 registros publicados por la IDE del IGP. La fuente no expone fecha por registro: freshness es FRESHNESS_UNKNOWN.",
    parameters: [],
    responseSchema: volcanoListResponseSchema,
    responseName: "VolcanoListResponse",
  },
  {
    path: "/v1/volcanoes/{slug}",
    summary: "Ficha de un volcán",
    description: "Registro publicado con procedencia y frescura explícita.",
    parameters: [
      {
        name: "slug",
        in: "path",
        required: true,
        description: "Slug del volcán, por ejemplo sabancaya",
        schema: { type: "string" },
      },
    ],
    responseSchema: volcanoDetailResponseSchema,
    responseName: "VolcanoDetailResponse",
  },
  {
    path: "/v1/sources",
    summary: "Estado observado de las fuentes",
    description:
      "Lo que observó nuestro consumidor sobre las fuentes públicas. No representa el estado interno del IGP.",
    parameters: [],
    responseSchema: sourcesResponseSchema,
    responseName: "SourcesResponse",
  },
  {
    path: "/v1/sources/{sourceId}",
    summary: "Historial observado de una fuente",
    description: "Chequeos recientes y evidencia de una fuente pública.",
    parameters: [
      {
        name: "sourceId",
        in: "path",
        required: true,
        description: "ID de la fuente, por ejemplo igp-aceldat",
        schema: { type: "string" },
      },
    ],
    responseSchema: sourceDetailResponseSchema,
    responseName: "SourceDetailResponse",
  },
];

const SOURCE_BADGE_PATH = "/v1/sources/{sourceId}/badge.svg";

export function buildOpenApiDocument(): Record<string, unknown> {
  const schemas: Record<string, unknown> = {
    ApiError: z.toJSONSchema(apiErrorSchema, { target: "draft-2020-12" }),
  };
  const paths: Record<string, unknown> = {};

  for (const endpoint of ENDPOINTS) {
    schemas[endpoint.responseName] = z.toJSONSchema(endpoint.responseSchema, {
      target: "draft-2020-12",
    });
    paths[endpoint.path] = {
      get: {
        summary: endpoint.summary,
        description: endpoint.description,
        parameters: endpoint.parameters,
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  $ref: `#/components/schemas/${endpoint.responseName}`,
                },
              },
            },
          },
          default: {
            description: "Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    };
  }

  paths[SOURCE_BADGE_PATH] = {
    get: {
      summary: "Badge del estado observado de una fuente",
      description:
        "SVG cacheable del estado observado por nuestro consumidor. No representa el estado interno del IGP.",
      parameters: [
        {
          name: "sourceId",
          in: "path",
          required: true,
          description: "ID de la fuente, por ejemplo igp-aceldat",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Badge SVG accesible",
          content: {
            "image/svg+xml": { schema: { type: "string" } },
          },
        },
        "404": {
          description: "Fuente desconocida representada como badge SVG",
          content: {
            "image/svg+xml": { schema: { type: "string" } },
          },
        },
      },
    },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "Sismo Abierto API",
      version: "0.1.0",
      description:
        "API comunitaria sobre datos sísmicos públicos del IGP y, cuando está habilitado, del Servicio Geológico Colombiano. Proyecto comunitario, no oficial. No es un sistema de alerta ni de predicción.",
    },
    servers: [{ url: "/api" }],
    paths,
    components: { schemas },
  };
}

export const API_ENDPOINT_PATHS = [
  ...ENDPOINTS.map((endpoint) => endpoint.path),
  SOURCE_BADGE_PATH,
];

export function responseSchemaFor(path: string): z.ZodType | null {
  return (
    ENDPOINTS.find((endpoint) => endpoint.path === path)?.responseSchema ?? null
  );
}

export function responseJsonSchemaFor(
  path: string,
): Record<string, unknown> | null {
  const schema = responseSchemaFor(path);
  if (!schema) return null;
  return z.toJSONSchema(schema, { target: "draft-2020-12" });
}
