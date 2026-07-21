import type { FrozenPrediction } from "@sismo/contracts";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (inQuotes) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

const EXPECTED_HEADER =
  "prediction_id,origin,origin_magnitude,target_regions,predicted_magnitude_min,predicted_magnitude_max,max_days,start_date,deadline_end_lima";

export function parseFrozenPredictions(csvText: string): FrozenPrediction[] {
  const lines = csvText.trim().split("\n");
  if (lines[0]?.trim() !== EXPECTED_HEADER) {
    throw new Error(
      `El CSV congelado no tiene el header esperado. Se rehúsa a interpretar un formato distinto: ${lines[0]}`,
    );
  }
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    if (cells.length !== 9) {
      throw new Error(
        `Fila congelada ilegible (${cells.length} celdas): ${line}`,
      );
    }
    const [
      id,
      origin,
      originMag,
      targets,
      magMin,
      magMax,
      maxDays,
      startDate,
      deadline,
    ] = cells as [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ];
    const prediction: FrozenPrediction = {
      predictionId: id,
      origin,
      originMagnitude: Number(originMag),
      targetRegions: targets.split(";").map((target) => target.trim()),
      predictedMagnitudeMin: Number(magMin),
      predictedMagnitudeMax: Number(magMax),
      maxDays: Number(maxDays),
      startDate,
      deadlineEndLima: deadline,
    };
    if (
      [
        prediction.originMagnitude,
        prediction.predictedMagnitudeMin,
        prediction.predictedMagnitudeMax,
        prediction.maxDays,
      ].some(Number.isNaN) ||
      Number.isNaN(Date.parse(prediction.deadlineEndLima))
    ) {
      throw new Error(`Valores congelados ilegibles en ${id}`);
    }
    return prediction;
  });
}
