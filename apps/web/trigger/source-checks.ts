import {
  buildProbeConfigs,
  getDefaultStore,
  runSourceChecks,
} from "@sismo/source-health";
import { schedules } from "@trigger.dev/sdk";

export const sourceChecksTask = schedules.task({
  id: "source-checks",
  cron: "*/30 * * * *",
  run: async () => {
    const configs = buildProbeConfigs();
    const checks = await runSourceChecks(getDefaultStore(), configs);
    return {
      checked: checks.length,
      statuses: Object.fromEntries(
        checks.map((check) => [check.sourceId, check.status]),
      ),
    };
  },
});
