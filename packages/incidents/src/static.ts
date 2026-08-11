import type { HumanitarianSnapshot, IncidentRecord } from "@sismo/contracts";

export const COLOMBIA_INCIDENT: IncidentRecord = {
  id: "colombia-2026-08-10",
  slug: "colombia-2026-08-10",
  country: "Colombia",
  countrySlug: "colombia",
  eventId: "sgc-SGC2026pqqmro",
  title: "Sismo M 7.4 en Colombia",
  location: "San José del Palmar, Chocó",
  startedAt: "2026-08-10T07:34:27-05:00",
  status: "active",
};

export const COLOMBIA_HUMANITARIAN_FALLBACK: HumanitarianSnapshot = {
  id: "humanitarian-colombia-2026-08-10-asocapitales-1730",
  versionLabel: "Balance preliminar Asocapitales",
  reviewStatus: "published",
  observedAt: "2026-08-10T17:30:00-05:00",
  publishedAt: "2026-08-10T18:29:44-05:00",
  source: {
    name: "Asociación Colombiana de Ciudades Capitales",
    url: "https://www.asocapitales.co/actualidad/noticias/ciudades-seguras/terremoto-en-colombia-deja-132-personas-fallecidas",
    reportNumber: null,
    issuedAt: "2026-08-10T17:30:00-05:00",
  },
  facts: [
    {
      key: "deaths",
      value: 132,
      displayValue: "132",
      label: "fallecidos en Colombia",
    },
    {
      key: "deaths_capitals",
      value: 87,
      displayValue: "87",
      label: "fallecidos en capitales",
    },
    {
      key: "injured",
      value: 570,
      displayValue: "570+",
      label: "heridos reportados",
    },
    {
      key: "red_alert_capitals",
      value: 5,
      displayValue: "5",
      label: "capitales en alerta roja",
    },
    {
      key: "buildings_collapsed",
      value: 86,
      displayValue: "86",
      label: "edificios colapsados",
    },
    {
      key: "airports_suspended",
      value: 7,
      displayValue: "7",
      label: "aeropuertos suspendidos",
    },
  ],
};

const COLOMBIA_UNGRD_REPORT_002: HumanitarianSnapshot = {
  id: "humanitarian-colombia-2026-08-10-report-002",
  versionLabel: "Reporte preliminar 002",
  reviewStatus: "published",
  observedAt: "2026-08-10T11:30:00-05:00",
  publishedAt: "2026-08-10T11:30:00-05:00",
  source: {
    name: "Unidad Nacional para la Gestión del Riesgo de Desastres",
    url: "https://www.gestiondelriesgo.gov.co/",
    reportNumber: "002",
    issuedAt: "2026-08-10T11:30:00-05:00",
  },
  facts: [
    { key: "deaths", value: 50, displayValue: "50", label: "fallecidos" },
    { key: "injured", value: 67, displayValue: "67", label: "heridos" },
    {
      key: "departments",
      value: 16,
      displayValue: "16",
      label: "departamentos afectados",
    },
    {
      key: "homes_destroyed",
      value: 77,
      displayValue: "77",
      label: "viviendas destruidas",
    },
    {
      key: "homes_damaged",
      value: 1684,
      displayValue: "1.684",
      label: "viviendas averiadas",
    },
    {
      key: "buildings_collapsed",
      value: 61,
      displayValue: "61",
      label: "edificios colapsados",
    },
  ],
};

export const COLOMBIA_HUMANITARIAN_HISTORY = [
  COLOMBIA_HUMANITARIAN_FALLBACK,
  COLOMBIA_UNGRD_REPORT_002,
] satisfies HumanitarianSnapshot[];
