import { getDefaultIncidentStore, syncIncidentSeismic } from "@sismo/incidents";
import { schedules } from "@trigger.dev/sdk";

export const incidentSeismicSyncTask = schedules.task({
  id: "incident-seismic-sync",
  cron: "* * * * *",
  run: async () => {
    if (!getDefaultIncidentStore()) {
      throw new Error("DATABASE_URL no está configurada");
    }
    const version = await syncIncidentSeismic();
    return {
      versionId: version?.id ?? null,
      observedAt: version?.observedAt ?? null,
    };
  },
});
