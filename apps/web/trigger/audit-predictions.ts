import {
  evaluatePrediction,
  loadPredictionRegistry,
  windowHasClosed,
} from "@sismo/audit";
import { schedules } from "@trigger.dev/sdk";

export const auditPredictionsTask = schedules.task({
  id: "audit-predictions",
  cron: "0 6 * * *",
  run: async () => {
    const registry = await loadPredictionRegistry();
    const now = Date.now();
    const results: Record<string, string> = {};
    for (const prediction of registry) {
      if (!windowHasClosed(prediction, now)) {
        results[prediction.predictionId] = "PENDING";
        continue;
      }
      const audit = await evaluatePrediction(prediction, now);
      results[prediction.predictionId] = audit.verdict;
    }
    return { evaluatedAt: new Date(now).toISOString(), results };
  },
});
