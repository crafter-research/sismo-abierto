import { describe, expect, test } from "bun:test";
import { computeFrequencyAnalysis } from "../src/frequency.ts";

function sine(frequencyHz: number, sampleRateHz: number, length: number) {
  return Array.from({ length }, (_, index) =>
    Math.sin((2 * Math.PI * frequencyHz * index) / sampleRateHz),
  );
}

describe("análisis de frecuencia", () => {
  test("ubica el pico de una señal sinusoidal en su frecuencia", () => {
    const signal = sine(10, 200, 4096);
    const analysis = computeFrequencyAnalysis(
      { z: signal, n: signal, e: signal },
      200,
      "cm/s2",
    );
    const peakIndex = analysis.spectrum.amplitudes.z.reduce(
      (best, value, index, values) =>
        value > (values[best] as number) ? index : best,
      0,
    );

    expect(analysis.spectrum.frequenciesHz[peakIndex]).toBeGreaterThanOrEqual(
      9.8,
    );
    expect(analysis.spectrum.frequenciesHz[peakIndex]).toBeLessThanOrEqual(
      10.2,
    );
    expect(analysis.spectrum.amplitudeUnit).toBe("cm/s2");
    expect(analysis.spectrum.overlapSamples).toBe(512);
  });

  test("produce un espectrograma acotado y sin valores no finitos", () => {
    const signal = sine(5, 100, 2048);
    const analysis = computeFrequencyAnalysis(
      { z: signal, n: signal, e: signal },
      100,
      "cm/s2",
    );
    const values = analysis.spectrogram.powerDb.z.flat();

    expect(analysis.spectrogram.timesSeconds.length).toBeLessThanOrEqual(64);
    expect(analysis.spectrogram.frequenciesHz.length).toBeLessThanOrEqual(48);
    expect(values.every(Number.isFinite)).toBe(true);
    expect(Math.max(...values)).toBe(0);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-60);
  });
});
