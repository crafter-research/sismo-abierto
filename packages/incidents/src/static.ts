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
  id: "humanitarian-colombia-2026-08-13-asocapitales-report-22",
  versionLabel: "Informe Consolidado No. 22 · 13/08 10:00",
  reviewStatus: "published",
  observedAt: "2026-08-13T10:00:00-05:00",
  publishedAt: "2026-08-13T11:54:11-05:00",
  source: {
    name: "Asociación Colombiana de Ciudades Capitales",
    url: "https://www.asocapitales.co/sites/default/files/2026-08/informe-terremoto-capitales-no-22.pdf",
    reportNumber: "22",
    issuedAt: "2026-08-13T10:00:00-05:00",
  },
  facts: [
    {
      key: "deaths",
      value: 273,
      displayValue: "273",
      label: "fallecidos en Colombia",
    },
    {
      key: "deaths_capitals",
      value: 204,
      displayValue: "204",
      label: "fallecidos en capitales",
    },
    {
      key: "injured_capitals",
      value: 1958,
      displayValue: "1.958",
      label: "heridos en capitales",
    },
    {
      key: "missing_capitals",
      value: 371,
      displayValue: "371",
      label: "desaparecidos o no localizados en capitales",
    },
    {
      key: "buildings_collapsed_capitals",
      value: 325,
      displayValue: "325",
      label: "estructuras colapsadas en capitales",
    },
  ],
};

const COLOMBIA_ASOCAPITALES_REPORT_14: HumanitarianSnapshot = {
  id: "humanitarian-colombia-2026-08-11-asocapitales-report-14",
  versionLabel: "Informe Consolidado No. 14 · 11/08 16:00",
  reviewStatus: "published",
  observedAt: "2026-08-11T16:00:00-05:00",
  publishedAt: "2026-08-11T16:24:35-05:00",
  source: {
    name: "Asociación Colombiana de Ciudades Capitales",
    url: "https://www.asocapitales.co/sites/default/files/2026-08/informe-no.14-4pm-asocapitales.pdf",
    reportNumber: "14",
    issuedAt: "2026-08-11T16:00:00-05:00",
  },
  facts: [
    {
      key: "deaths_capitals",
      value: 188,
      displayValue: "188",
      label: "fallecidos en capitales",
    },
    {
      key: "injured_capitals",
      value: 1677,
      displayValue: "1.677",
      label: "heridos en capitales",
    },
    {
      key: "injured_national",
      value: 2595,
      displayValue: "2.595",
      label: "heridos a nivel nacional",
    },
    {
      key: "buildings_collapsed_capitals",
      value: 243,
      displayValue: "243",
      label: "estructuras colapsadas en capitales",
    },
  ],
};

const COLOMBIA_ASOCAPITALES_169: HumanitarianSnapshot = {
  id: "humanitarian-colombia-2026-08-11-asocapitales-0640",
  versionLabel: "Balance Asocapitales 11/08 06:40",
  reviewStatus: "published",
  observedAt: "2026-08-11T06:40:53-05:00",
  publishedAt: "2026-08-11T06:53:46-05:00",
  source: {
    name: "Asociación Colombiana de Ciudades Capitales",
    url: "https://www.asocapitales.co/actualidad/noticias/ciudades-seguras/casi-24-horas-del-terremoto-colombia-registra-169-fallecidos",
    reportNumber: null,
    issuedAt: "2026-08-11T06:40:53-05:00",
  },
  facts: [
    {
      key: "deaths",
      value: 169,
      displayValue: "169",
      label: "fallecidos en Colombia",
    },
    {
      key: "deaths_capitals",
      value: 165,
      displayValue: "165",
      label: "fallecidos en capitales",
    },
    {
      key: "injured_capitals",
      value: 668,
      displayValue: "668",
      label: "heridos en capitales",
    },
    {
      key: "buildings_collapsed_capitals",
      value: 165,
      displayValue: "165",
      label: "edificaciones colapsadas en capitales",
    },
  ],
};

const COLOMBIA_ASOCAPITALES_132: HumanitarianSnapshot = {
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
  COLOMBIA_ASOCAPITALES_REPORT_14,
  COLOMBIA_ASOCAPITALES_169,
  COLOMBIA_ASOCAPITALES_132,
  COLOMBIA_UNGRD_REPORT_002,
] satisfies HumanitarianSnapshot[];
