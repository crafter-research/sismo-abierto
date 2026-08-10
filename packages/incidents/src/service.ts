import { createHash } from "node:crypto";
import {
  type HumanitarianSnapshot,
  type HumanitarianSubmission,
  humanitarianSnapshotSchema,
  humanitarianSubmissionSchema,
  type IncidentHistoryEntry,
  type IncidentRecord,
  type IncidentViewResponse,
  normalizedEventSchema,
} from "@sismo/contracts";
import { getEvent } from "@sismo/data";
import { NeonIncidentStore } from "./neon-store.ts";
import { COLOMBIA_HUMANITARIAN_FALLBACK, COLOMBIA_INCIDENT } from "./static.ts";
import type {
  HumanitarianVersionPayload,
  IncidentStore,
  IncidentVersion,
  SeismicVersionPayload,
} from "./types.ts";

const STATIC_INCIDENTS = [COLOMBIA_INCIDENT];
const INCIDENT_LIMITATIONS = [
  "No es un sistema de alerta temprana ni reemplaza las instrucciones de las autoridades.",
  "Los parámetros sísmicos automáticos pueden ser revisados por el SGC.",
  "Las cifras humanitarias solo cambian cuando un reporte nuevo es revisado y publicado.",
];

let defaultStore: IncidentStore | null | undefined;

export function getDefaultIncidentStore(): IncidentStore | null {
  if (defaultStore === undefined) {
    defaultStore = process.env.DATABASE_URL
      ? new NeonIncidentStore(process.env.DATABASE_URL)
      : null;
  }
  return defaultStore;
}

export function setDefaultIncidentStore(store: IncidentStore | null): void {
  defaultStore = store;
}

function stableId(prefix: string, value: unknown): string {
  return `${prefix}-${createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 20)}`;
}

function humanitarianFallbackVersion(): IncidentVersion {
  const snapshot = COLOMBIA_HUMANITARIAN_FALLBACK;
  return {
    id: snapshot.id,
    incidentId: COLOMBIA_INCIDENT.id,
    kind: "humanitarian",
    versionLabel: snapshot.versionLabel,
    reviewStatus: "published",
    observedAt: snapshot.observedAt,
    publishedAt: snapshot.publishedAt,
    source: snapshot.source,
    payload: { facts: snapshot.facts } satisfies HumanitarianVersionPayload,
    createdAt: snapshot.publishedAt,
  };
}

async function seedIncident(
  store: IncidentStore,
  incident: IncidentRecord,
): Promise<void> {
  await store.upsertIncident(incident);
  if (incident.id === COLOMBIA_INCIDENT.id) {
    await store.insertVersion(humanitarianFallbackVersion());
  }
}

function versionToHumanitarian(version: IncidentVersion): HumanitarianSnapshot {
  const payload = version.payload as HumanitarianVersionPayload;
  return humanitarianSnapshotSchema.parse({
    id: version.id,
    versionLabel: version.versionLabel,
    reviewStatus: "published",
    observedAt: version.observedAt,
    publishedAt: version.publishedAt ?? version.observedAt,
    source: version.source,
    facts: payload.facts,
  });
}

function versionToSeismic(version: IncidentVersion) {
  const payload = version.payload as SeismicVersionPayload;
  return {
    event: normalizedEventSchema.parse(payload.event),
    syncedAt: payload.syncedAt,
  };
}

function versionToHistory(version: IncidentVersion): IncidentHistoryEntry {
  return {
    id: version.id,
    kind: version.kind,
    versionLabel: version.versionLabel,
    reviewStatus: version.reviewStatus,
    observedAt: version.observedAt,
    publishedAt: version.publishedAt,
    source: version.source,
  };
}

function seismicFreshness(syncedAt: string, now: Date) {
  const ageMs = now.getTime() - Date.parse(syncedAt);
  if (!Number.isFinite(ageMs)) return "UNKNOWN" as const;
  if (ageMs <= 2 * 60_000) return "FRESH" as const;
  if (ageMs <= 15 * 60_000) return "DELAYED" as const;
  return "STALE" as const;
}

function isRecent(version: IncidentVersion | null, now: Date): boolean {
  if (!version) return false;
  const syncedAt = (version.payload as Partial<SeismicVersionPayload>).syncedAt;
  if (!syncedAt) return false;
  return now.getTime() - Date.parse(syncedAt) <= 90_000;
}

async function fetchAndStoreSeismic(
  incident: IncidentRecord,
  store: IncidentStore | null,
  now: Date,
): Promise<IncidentVersion> {
  const event = await getEvent(incident.eventId);
  const syncedAt = now.toISOString();
  const observedAt =
    event.provenance.sourceUpdatedAt ?? event.provenance.fetchedAt ?? syncedAt;
  const source = {
    name: event.provenance.source.name,
    url: event.provenance.source.url,
    reportNumber: event.sourceEventId ?? null,
    issuedAt: observedAt,
  };
  const payload = { event, syncedAt } satisfies SeismicVersionPayload;
  const version: IncidentVersion = {
    id: stableId(`seismic-${incident.id}`, {
      magnitude: event.magnitude,
      depthKm: event.depthKm,
      latitude: event.latitude,
      longitude: event.longitude,
      reviewStatus: event.reviewStatus,
      observedAt,
    }),
    incidentId: incident.id,
    kind: "seismic",
    versionLabel: `${event.agency ?? "SGC"} ${event.reviewStatus ?? "automático"}`,
    reviewStatus: "automatic",
    observedAt,
    publishedAt: syncedAt,
    source,
    payload,
    createdAt: syncedAt,
  };
  if (store) await store.insertVersion(version);
  return version;
}

export async function syncIncidentSeismic(
  slug = COLOMBIA_INCIDENT.slug,
  store = getDefaultIncidentStore(),
): Promise<IncidentVersion | null> {
  const incident =
    STATIC_INCIDENTS.find((entry) => entry.slug === slug) ??
    (store ? await store.getIncident(slug) : null);
  if (!incident) return null;
  if (store) await seedIncident(store, incident);
  return fetchAndStoreSeismic(incident, store, new Date());
}

export async function getIncidentView(
  slug = COLOMBIA_INCIDENT.slug,
  store = getDefaultIncidentStore(),
  now = new Date(),
  refreshSeismic = true,
): Promise<IncidentViewResponse | null> {
  const staticIncident = STATIC_INCIDENTS.find((entry) => entry.slug === slug);
  let incident = staticIncident ?? null;
  let humanitarian =
    staticIncident?.id === COLOMBIA_INCIDENT.id
      ? COLOMBIA_HUMANITARIAN_FALLBACK
      : null;
  let seismicVersion: IncidentVersion | null = null;
  let history: IncidentHistoryEntry[] = humanitarian
    ? [versionToHistory(humanitarianFallbackVersion())]
    : [];
  let storage: IncidentViewResponse["storage"] = "fallback";

  if (store) {
    try {
      if (staticIncident) await seedIncident(store, staticIncident);
      incident = (await store.getIncident(slug)) ?? incident;
      if (!incident) return null;
      const [storedHumanitarian, storedSeismic, versions] = await Promise.all([
        store.getLatestVersion(incident.id, "humanitarian", ["published"]),
        store.getLatestVersion(incident.id, "seismic", ["automatic"]),
        store.listVersions(incident.id, ["automatic", "published"], 12),
      ]);
      if (storedHumanitarian) {
        humanitarian = versionToHumanitarian(storedHumanitarian);
      }
      seismicVersion = storedSeismic;
      history = versions.map(versionToHistory);
      storage = "database";
    } catch {
      storage = "fallback";
    }
  }

  if (!incident || !humanitarian) return null;

  if (refreshSeismic && !isRecent(seismicVersion, now)) {
    try {
      seismicVersion = await fetchAndStoreSeismic(
        incident,
        storage === "database" ? store : null,
        now,
      );
      const current = versionToHistory(seismicVersion);
      history = [
        current,
        ...history.filter((entry) => entry.id !== current.id),
      ];
    } catch {
      seismicVersion = seismicVersion ?? null;
    }
  }

  const seismic = seismicVersion
    ? {
        ...versionToSeismic(seismicVersion),
        freshness: seismicFreshness(
          (seismicVersion.payload as SeismicVersionPayload).syncedAt,
          now,
        ),
      }
    : null;

  return {
    incident,
    seismic,
    humanitarian,
    history,
    storage,
    generatedAt: now.toISOString(),
    limitations: INCIDENT_LIMITATIONS,
  };
}

export async function submitHumanitarianSnapshot(
  incidentId: string,
  input: HumanitarianSubmission,
  store = getDefaultIncidentStore(),
): Promise<IncidentVersion> {
  if (!store) throw new Error("DATABASE_URL no está configurada");
  const submission = humanitarianSubmissionSchema.parse(input);
  const incident = STATIC_INCIDENTS.find((entry) => entry.id === incidentId);
  if (incident) await seedIncident(store, incident);
  const createdAt = new Date().toISOString();
  const version: IncidentVersion = {
    id: stableId(`humanitarian-${incidentId}`, { submission, createdAt }),
    incidentId,
    kind: "humanitarian",
    versionLabel: submission.versionLabel,
    reviewStatus: "pending",
    observedAt: submission.observedAt,
    publishedAt: null,
    source: submission.source,
    payload: { facts: submission.facts } satisfies HumanitarianVersionPayload,
    createdAt,
  };
  await store.insertVersion(version);
  return version;
}

export async function listPendingHumanitarianVersions(
  incidentId: string,
  store = getDefaultIncidentStore(),
): Promise<IncidentVersion[]> {
  if (!store) throw new Error("DATABASE_URL no está configurada");
  return store.listVersions(incidentId, ["pending"], 50);
}

export async function publishHumanitarianVersion(
  incidentId: string,
  versionId: string,
  store = getDefaultIncidentStore(),
): Promise<IncidentVersion | null> {
  if (!store) throw new Error("DATABASE_URL no está configurada");
  return store.publishVersion(incidentId, versionId, new Date().toISOString());
}
