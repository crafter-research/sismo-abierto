import type { NormalizedEvent } from "@sismo/contracts";
import { COLOMBIA_INCIDENT } from "@sismo/incidents";

export const MAJOR_EARTHQUAKE_THRESHOLD = 7;

export function emergencyHref(event: NormalizedEvent): string {
  return event.id === COLOMBIA_INCIDENT.eventId
    ? "/colombia/emergencia"
    : `/sismos/${event.id}`;
}
