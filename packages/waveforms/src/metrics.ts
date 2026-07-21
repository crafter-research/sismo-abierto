export function peakAbsolute(series: number[]): number {
  let peak = 0;
  for (const value of series) {
    const abs = Math.abs(value);
    if (abs > peak) peak = abs;
  }
  return peak;
}

export function computePga(components: {
  z: number[];
  n: number[];
  e: number[];
}): { z: number; n: number; e: number } {
  return {
    z: peakAbsolute(components.z),
    n: peakAbsolute(components.n),
    e: peakAbsolute(components.e),
  };
}

export function reduceForView(
  series: number[],
  targetBuckets: number,
): number[] {
  if (series.length <= targetBuckets * 2) return [...series];
  const bucketSize = series.length / targetBuckets;
  const reduced: number[] = [];
  for (let bucket = 0; bucket < targetBuckets; bucket++) {
    const start = Math.floor(bucket * bucketSize);
    const end = Math.min(series.length, Math.floor((bucket + 1) * bucketSize));
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let minIndex = start;
    let maxIndex = start;
    for (let i = start; i < end; i++) {
      const value = series[i] as number;
      if (value < min) {
        min = value;
        minIndex = i;
      }
      if (value > max) {
        max = value;
        maxIndex = i;
      }
    }
    if (minIndex <= maxIndex) {
      reduced.push(min, max);
    } else {
      reduced.push(max, min);
    }
  }
  return reduced;
}
