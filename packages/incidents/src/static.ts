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
