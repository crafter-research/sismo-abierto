import type { Provenance } from "./provenance.ts";

export interface VolcanoRecord {
  slug: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  publishedLevel: string;
  publishedActivity: string;
  publishedReview: string;
  objectId: number;
  provenance: Provenance;
}

export interface DatedPublication {
  id: string;
  title: string;
  issuedDate: string;
  url: string;
  provenance: Provenance;
}
