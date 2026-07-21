import {
  SOURCES,
  type SourceCheck,
  type SourceId,
  type SourceState,
} from "@sismo/contracts";
import { NeonSourceHealthStore } from "./neon-store.ts";
import {
  deriveConsumerStatus,
  type ProbeObservation,
  SOURCE_HEALTH_DISCLAIMER,
} from "./observation.ts";
import { probeSource } from "./probe.ts";
import { buildProbeConfigs, type ProbeConfig } from "./probe-configs.ts";
import { MemorySourceHealthStore, type SourceHealthStore } from "./store.ts";

let defaultStore: SourceHealthStore | null = null;

export function getDefaultStore(): SourceHealthStore {
  if (!defaultStore) {
    const databaseUrl = process.env.DATABASE_URL;
    defaultStore = databaseUrl
      ? new NeonSourceHealthStore(databaseUrl)
      : new MemorySourceHealthStore();
  }
  return defaultStore;
}

export function setDefaultStore(store: SourceHealthStore | null): void {
  defaultStore = store;
}

let checkCounter = 0;

export function observationToCheck(observation: ProbeObservation): SourceCheck {
  checkCounter += 1;
  return {
    id: `check-${observation.checkedAt.replace(/[-:.]/g, "")}-${observation.sourceId}-${checkCounter}`,
    sourceId: observation.sourceId,
    checkedAt: observation.checkedAt,
    httpStatus: observation.httpStatus,
    durationMs: observation.durationMs,
    contentType: observation.contentType,
    schemaValid: observation.schemaValid,
    recordCount: observation.recordCount,
    status: deriveConsumerStatus(observation),
    evidence: observation.evidence,
  };
}

export async function recordCheck(
  store: SourceHealthStore,
  check: SourceCheck,
): Promise<SourceState> {
  await store.insertCheck(check);
  const previous = await store.getState(check.sourceId);
  const failing =
    check.status === "UNAVAILABLE" || check.status === "SCHEMA_CHANGED";
  const state: SourceState = {
    sourceId: check.sourceId,
    status: check.status,
    lastCheckAt: check.checkedAt,
    lastCheckId: check.id,
    consecutiveFailures: failing ? (previous?.consecutiveFailures ?? 0) + 1 : 0,
  };
  await store.setState(state);

  const openChange = await store.getOpenChange(check.sourceId);
  if (previous && previous.status !== check.status) {
    if (openChange) {
      await store.closeChange(openChange.id, check.checkedAt, check.id);
    }
    if (check.status !== "OPERATIONAL") {
      await store.insertChange({
        id: `change-${check.id}`,
        sourceId: check.sourceId,
        fromStatus: previous.status,
        toStatus: check.status,
        openedAt: check.checkedAt,
        closedAt: null,
        openingCheckId: check.id,
        closingCheckId: null,
        reason: check.evidence,
      });
    }
  }
  return state;
}

export async function runSourceChecks(
  store: SourceHealthStore = getDefaultStore(),
  configs: ProbeConfig[] = buildProbeConfigs(),
): Promise<SourceCheck[]> {
  const checks: SourceCheck[] = [];
  for (const config of configs) {
    const observation = await probeSource(config);
    const check = observationToCheck(observation);
    await recordCheck(store, check);
    checks.push(check);
  }
  return checks;
}

export async function getSourceOverview(
  store: SourceHealthStore = getDefaultStore(),
) {
  const states = await store.listStates();
  const sources = await Promise.all(
    (Object.keys(SOURCES) as SourceId[]).map(async (sourceId) => {
      const state = states.find((entry) => entry.sourceId === sourceId) ?? null;
      const lastCheck = state
        ? ((await store.listChecks(sourceId, 1))[0] ?? null)
        : null;
      return {
        sourceId,
        source: SOURCES[sourceId],
        status: state?.status ?? ("FRESHNESS_UNKNOWN" as const),
        lastCheckAt: state?.lastCheckAt ?? null,
        latencyMs: lastCheck?.durationMs ?? null,
        disclaimer: SOURCE_HEALTH_DISCLAIMER,
      };
    }),
  );
  return { sources, disclaimer: SOURCE_HEALTH_DISCLAIMER };
}

export async function getSourceHistory(
  sourceId: string,
  store: SourceHealthStore = getDefaultStore(),
) {
  if (!(sourceId in SOURCES)) return null;
  const typedId = sourceId as SourceId;
  const state = await store.getState(typedId);
  const checks = await store.listChecks(typedId, 30);
  const changes = await store.listChanges(typedId, 20);
  return {
    source: {
      sourceId: typedId,
      source: SOURCES[typedId],
      status: state?.status ?? ("FRESHNESS_UNKNOWN" as const),
      lastCheckAt: state?.lastCheckAt ?? null,
      latencyMs: checks[0]?.durationMs ?? null,
      disclaimer: SOURCE_HEALTH_DISCLAIMER,
    },
    recentChecks: checks.map((check) => ({
      checkedAt: check.checkedAt,
      status: check.status,
      httpStatus: check.httpStatus,
      durationMs: check.durationMs,
      evidence: check.evidence,
    })),
    changes,
    disclaimer: SOURCE_HEALTH_DISCLAIMER,
  };
}

export function isPublicSourcesPageEnabled(): boolean {
  return (
    process.env.SISMO_FUENTES_PUBLIC === "true" ||
    process.env.NODE_ENV !== "production"
  );
}
