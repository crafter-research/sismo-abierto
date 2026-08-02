import type { FrequencyAnalysis } from "@sismo/contracts";

type Components = { z: number[]; n: number[]; e: number[] };
type ComponentKey = keyof Components;

const COMPONENT_KEYS: ComponentKey[] = ["z", "n", "e"];
const SPECTRUM_WINDOW = 1024;
const SPECTROGRAM_WINDOW = 256;
const MAX_TIME_FRAMES = 64;
const MAX_FREQUENCY_BANDS = 48;
const MIN_DB = -60;

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function powerOfTwoAtMost(value: number): number {
  let size = 1;
  while (size * 2 <= value) size *= 2;
  return size;
}

function fftReal(input: number[]): { real: number[]; imaginary: number[] } {
  const size = input.length;
  const real = [...input];
  const imaginary = new Array<number>(size).fill(0);

  for (let index = 1, reversed = 0; index < size; index++) {
    let bit = size >> 1;
    while (reversed & bit) {
      reversed ^= bit;
      bit >>= 1;
    }
    reversed ^= bit;
    if (index < reversed) {
      [real[index], real[reversed]] = [
        real[reversed] as number,
        real[index] as number,
      ];
    }
  }

  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    for (let start = 0; start < size; start += length) {
      let rotationReal = 1;
      let rotationImaginary = 0;
      for (let offset = 0; offset < length / 2; offset++) {
        const even = start + offset;
        const odd = even + length / 2;
        const oddReal =
          (real[odd] as number) * rotationReal -
          (imaginary[odd] as number) * rotationImaginary;
        const oddImaginary =
          (real[odd] as number) * rotationImaginary +
          (imaginary[odd] as number) * rotationReal;
        real[odd] = (real[even] as number) - oddReal;
        imaginary[odd] = (imaginary[even] as number) - oddImaginary;
        real[even] = (real[even] as number) + oddReal;
        imaginary[even] = (imaginary[even] as number) + oddImaginary;
        const nextReal = rotationReal * cosine - rotationImaginary * sine;
        rotationImaginary = rotationReal * sine + rotationImaginary * cosine;
        rotationReal = nextReal;
      }
    }
  }

  return { real, imaginary };
}

function frameStarts(length: number, windowSize: number, hopSize: number) {
  if (length <= windowSize) return [0];
  const starts: number[] = [];
  for (let start = 0; start <= length - windowSize; start += hopSize) {
    starts.push(start);
  }
  const finalStart = length - windowSize;
  if (starts.at(-1) !== finalStart) starts.push(finalStart);
  return starts;
}

function selectEvenly(values: number[], limit: number): number[] {
  if (values.length <= limit) return values;
  return Array.from({ length: limit }, (_, index) => {
    const sourceIndex = Math.round((index / (limit - 1)) * (values.length - 1));
    return values[sourceIndex] as number;
  });
}

function frameAmplitudes(
  series: number[],
  start: number,
  windowSize: number,
): number[] {
  const values = series.slice(start, start + windowSize);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const windowed = values.map((value, index) => {
    const weight =
      windowSize === 1
        ? 1
        : 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (windowSize - 1));
    return (value - mean) * weight;
  });
  const windowSum = Array.from({ length: windowSize }, (_, index) =>
    windowSize === 1
      ? 1
      : 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (windowSize - 1)),
  ).reduce((sum, value) => sum + value, 0);
  const { real, imaginary } = fftReal(windowed);
  return Array.from({ length: windowSize / 2 + 1 }, (_, index) => {
    const magnitude = Math.hypot(
      real[index] as number,
      imaginary[index] as number,
    );
    const oneSidedFactor = index === 0 || index === windowSize / 2 ? 1 : 2;
    return (magnitude * oneSidedFactor) / (windowSum || 1);
  });
}

function averageSpectrum(
  series: number[],
  windowSize: number,
  hopSize: number,
): number[] {
  const starts = frameStarts(series.length, windowSize, hopSize);
  const sum = new Array<number>(windowSize / 2 + 1).fill(0);
  for (const start of starts) {
    const amplitudes = frameAmplitudes(series, start, windowSize);
    for (let index = 0; index < sum.length; index++) {
      sum[index] = (sum[index] as number) + (amplitudes[index] as number);
    }
  }
  return sum.map((value) => round(value / starts.length, 6));
}

function reduceFrequencyBands(frames: number[][], limit: number): number[][] {
  const sourceBands = frames[0]?.length ?? 0;
  if (sourceBands <= limit) return frames;
  return frames.map((frame) =>
    Array.from({ length: limit }, (_, index) => {
      const start = Math.floor((index / limit) * sourceBands);
      const end = Math.max(
        start + 1,
        Math.floor(((index + 1) / limit) * sourceBands),
      );
      return Math.max(...frame.slice(start, end));
    }),
  );
}

function relativeDb(frames: number[][]): number[][] {
  const maximum = Math.max(...frames.flat(), 0);
  return frames.map((frame) =>
    frame.map((value) => {
      if (maximum === 0) return MIN_DB;
      return round(
        Math.max(MIN_DB, 20 * Math.log10(Math.max(value / maximum, 0.001))),
        1,
      );
    }),
  );
}

export function computeFrequencyAnalysis(
  components: Components,
  sampleRateHz: number,
  units: string,
): FrequencyAnalysis {
  const sampleCount = Math.min(
    components.z.length,
    components.n.length,
    components.e.length,
  );
  const spectrumWindow = powerOfTwoAtMost(
    Math.min(SPECTRUM_WINDOW, sampleCount),
  );
  const spectrumHop = Math.max(1, spectrumWindow / 2);
  const spectrumFrequencies = Array.from(
    { length: spectrumWindow / 2 + 1 },
    (_, index) => round((index * sampleRateHz) / spectrumWindow, 4),
  );
  const amplitudes = Object.fromEntries(
    COMPONENT_KEYS.map((key) => [
      key,
      averageSpectrum(components[key], spectrumWindow, spectrumHop),
    ]),
  ) as FrequencyAnalysis["spectrum"]["amplitudes"];

  const spectrogramWindow = powerOfTwoAtMost(
    Math.min(SPECTROGRAM_WINDOW, sampleCount),
  );
  const spectrogramHop = Math.max(1, spectrogramWindow / 2);
  const allStarts = frameStarts(sampleCount, spectrogramWindow, spectrogramHop);
  const selectedStarts = selectEvenly(allStarts, MAX_TIME_FRAMES);
  const timesSeconds = selectedStarts.map((start) =>
    round((start + spectrogramWindow / 2) / sampleRateHz, 3),
  );
  const sourceFrequencyCount = spectrogramWindow / 2 + 1;
  const outputFrequencyCount = Math.min(
    sourceFrequencyCount,
    MAX_FREQUENCY_BANDS,
  );
  const frequenciesHz = Array.from(
    { length: outputFrequencyCount },
    (_, index) =>
      round(
        (((index + 0.5) / outputFrequencyCount) *
          sourceFrequencyCount *
          sampleRateHz) /
          spectrogramWindow,
        3,
      ),
  );
  const powerDb = Object.fromEntries(
    COMPONENT_KEYS.map((key) => {
      const frames = selectedStarts.map((start) =>
        frameAmplitudes(components[key], start, spectrogramWindow),
      );
      return [
        key,
        relativeDb(reduceFrequencyBands(frames, MAX_FREQUENCY_BANDS)),
      ];
    }),
  ) as FrequencyAnalysis["spectrogram"]["powerDb"];

  return {
    spectrum: {
      windowSizeSamples: spectrumWindow,
      overlapSamples: spectrumWindow - spectrumHop,
      frequencyResolutionHz: round(sampleRateHz / spectrumWindow, 4),
      amplitudeUnit: units,
      frequenciesHz: spectrumFrequencies,
      amplitudes,
    },
    spectrogram: {
      windowSizeSamples: spectrogramWindow,
      overlapSamples: spectrogramWindow - spectrogramHop,
      timeResolutionSeconds: round(spectrogramHop / sampleRateHz, 4),
      frequencyResolutionHz: round(sampleRateHz / spectrogramWindow, 4),
      powerUnit: "dB rel.",
      minDb: MIN_DB,
      maxDb: 0,
      timesSeconds,
      frequenciesHz,
      powerDb,
    },
  };
}
