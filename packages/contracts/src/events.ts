import type { FieldProvenance, Provenance } from "./provenance.ts";

export interface NormalizedEvent {
  id: string;
  timeUtc: string | null;
  timeLocal: string | null;
  magnitude: number;
  depthKm: number;
  latitude: number;
  longitude: number;
  reference: string | null;
  intensity: string | null;
  aceldatReportNumber: number | null;
  provenance: Provenance;
  fieldClasses: FieldProvenance;
}

export interface EventStation {
  code: string;
  network: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: "acc" | "sis";
  order: number;
  epicentralDistanceKm: number | null;
  hasWaveform: boolean;
  officialPga: { z: number; n: number; e: number } | null;
  provenance: Provenance;
}

export interface WaveformHeader {
  stationName: string;
  stationCode: string;
  stationLatitude: number;
  stationLongitude: number;
  eventDateLocal: string;
  eventTimeLocal: string;
  eventLatitude: number;
  eventLongitude: number;
  eventDepthKm: number;
  eventMagnitude: number;
  epicentralDistanceKm: number;
  startTimeUtc: string;
  sampleCount: number;
  sampleRateHz: number;
  units: string;
  baselineCorrected: boolean;
  pga: { z: number; n: number; e: number };
}

export interface FrequencyAnalysis {
  spectrum: {
    windowSizeSamples: number;
    overlapSamples: number;
    frequencyResolutionHz: number;
    amplitudeUnit: string;
    frequenciesHz: number[];
    amplitudes: { z: number[]; n: number[]; e: number[] };
  };
  spectrogram: {
    windowSizeSamples: number;
    overlapSamples: number;
    timeResolutionSeconds: number;
    frequencyResolutionHz: number;
    powerUnit: "dB rel.";
    minDb: number;
    maxDb: number;
    timesSeconds: number[];
    frequenciesHz: number[];
    powerDb: { z: number[][]; n: number[][]; e: number[][] };
  };
}

export interface WaveformView {
  eventId: string;
  stationId: string;
  header: WaveformHeader;
  computedPga: { z: number; n: number; e: number };
  computedOverFullSeries: boolean;
  reducedComponents: { z: number[]; n: number[]; e: number[] };
  frequencyAnalysis: FrequencyAnalysis;
  reductionFactor: number;
  sourceFileUrl: string;
  provenance: Provenance;
}

export interface EventQueryFilters {
  since?: string;
  until?: string;
  minMagnitude?: number;
  maxMagnitude?: number;
  minDepthKm?: number;
  maxDepthKm?: number;
}
