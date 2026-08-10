import type { z } from "zod";
import type {
  humanitarianSnapshotSchema,
  humanitarianSubmissionSchema,
  incidentFactSchema,
  incidentHistoryEntrySchema,
  incidentRecordSchema,
  incidentSourceSchema,
  incidentViewResponseSchema,
} from "./schemas.ts";

export type IncidentFact = z.infer<typeof incidentFactSchema>;
export type IncidentSource = z.infer<typeof incidentSourceSchema>;
export type IncidentRecord = z.infer<typeof incidentRecordSchema>;
export type HumanitarianSnapshot = z.infer<typeof humanitarianSnapshotSchema>;
export type HumanitarianSubmission = z.infer<
  typeof humanitarianSubmissionSchema
>;
export type IncidentHistoryEntry = z.infer<typeof incidentHistoryEntrySchema>;
export type IncidentViewResponse = z.infer<typeof incidentViewResponseSchema>;
