"use client";

import type { WaveformView } from "@sismo/contracts";
import { useId, useState } from "react";

const COMPONENTS: Array<{
  key: "z" | "n" | "e";
  label: string;
  description: string;
}> = [
  { key: "z", label: "Z", description: "Vertical" },
  { key: "n", label: "N", description: "Norte-Sur" },
  { key: "e", label: "E", description: "Este-Oeste" },
];

const CHART_WIDTH = 900;
const CHART_HEIGHT = 110;

function seriesPath(
  series: number[],
  startPct: number,
  widthPct: number,
  peak: number,
): string {
  const start = Math.floor((startPct / 100) * series.length);
  const end = Math.min(
    series.length,
    Math.ceil(((startPct + widthPct) / 100) * series.length),
  );
  const window = series.slice(start, Math.max(end, start + 2));
  const scaleY = peak === 0 ? 1 : CHART_HEIGHT / 2 / peak;
  const stepX = CHART_WIDTH / (window.length - 1 || 1);
  return window
    .map((value, index) => {
      const x = (index * stepX).toFixed(2);
      const y = (CHART_HEIGHT / 2 - value * scaleY).toFixed(2);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join("");
}

export function WaveformViewer({ waveform }: { waveform: WaveformView }) {
  const [visible, setVisible] = useState<Record<string, boolean>>({
    z: true,
    n: true,
    e: true,
  });
  const [startPct, setStartPct] = useState(0);
  const [widthPct, setWidthPct] = useState(100);
  const tableId = useId();

  const peak = Math.max(
    waveform.computedPga.z,
    waveform.computedPga.n,
    waveform.computedPga.e,
  );
  const durationSeconds =
    waveform.header.sampleCount / waveform.header.sampleRateHz;
  const windowStartSeconds = (startPct / 100) * durationSeconds;
  const windowEndSeconds = ((startPct + widthPct) / 100) * durationSeconds;

  return (
    <div className="space-y-4" data-testid="waveform-viewer">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {COMPONENTS.map((component) => (
          <label key={component.key} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={visible[component.key] ?? true}
              onChange={() =>
                setVisible((previous) => ({
                  ...previous,
                  [component.key]: !(previous[component.key] ?? true),
                }))
              }
            />
            <span className="font-mono font-semibold">{component.label}</span>
            <span className="text-gray-500">{component.description}</span>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        {COMPONENTS.filter((component) => visible[component.key] ?? true).map(
          (component) => (
            <figure
              key={component.key}
              data-testid={`waveform-${component.key}`}
            >
              <figcaption className="mb-1 flex items-baseline gap-3 text-xs text-gray-600">
                <span className="font-mono text-sm font-bold text-gray-900">
                  {component.label} · {component.description}
                </span>
                <span>
                  PGA calculado:{" "}
                  <span className="font-mono">
                    {waveform.computedPga[component.key].toFixed(4)}{" "}
                    {waveform.header.units}
                  </span>
                </span>
              </figcaption>
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                role="img"
                aria-label={`Componente ${component.label} (${component.description}), ventana de ${windowStartSeconds.toFixed(1)} a ${windowEndSeconds.toFixed(1)} segundos. Alternativa tabular disponible debajo.`}
                className="h-24 w-full rounded border border-gray-200 bg-background-100"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1={CHART_HEIGHT / 2}
                  x2={CHART_WIDTH}
                  y2={CHART_HEIGHT / 2}
                  stroke="var(--color-gray-300)"
                />
                <path
                  d={seriesPath(
                    waveform.reducedComponents[component.key],
                    startPct,
                    widthPct,
                    peak,
                  )}
                  fill="none"
                  stroke="var(--color-gray-1000)"
                  strokeWidth="1"
                />
              </svg>
            </figure>
          ),
        )}
      </div>

      <fieldset className="rounded border border-gray-200 p-3 text-sm">
        <legend className="px-1 text-xs font-semibold uppercase text-gray-500">
          Zoom horizontal compartido
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span>
              Inicio de la ventana:{" "}
              <span className="font-mono">
                {windowStartSeconds.toFixed(1)} s
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={95}
              step={1}
              value={startPct}
              onChange={(changeEvent) => {
                const value = Number(changeEvent.target.value);
                setStartPct(value);
                if (value + widthPct > 100) setWidthPct(100 - value);
              }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>
              Ancho de la ventana:{" "}
              <span className="font-mono">
                {((widthPct / 100) * durationSeconds).toFixed(1)} s
              </span>
            </span>
            <input
              type="range"
              min={5}
              max={100}
              step={1}
              value={widthPct}
              onChange={(changeEvent) => {
                const value = Number(changeEvent.target.value);
                setWidthPct(Math.min(value, 100 - startPct));
              }}
            />
          </label>
        </div>
      </fieldset>

      <details className="rounded border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Alternativa tabular accesible de las gráficas
        </summary>
        <p className="mt-2 text-xs text-gray-600">
          Resumen numérico calculado sobre la serie completa (
          {waveform.header.sampleCount} muestras a{" "}
          {waveform.header.sampleRateHz} muestras/segundo).
        </p>
        <table
          id={tableId}
          className="mt-2 w-full text-sm"
          data-testid="waveform-table"
        >
          <caption className="sr-only">
            Métricas por componente calculadas sobre la serie completa
          </caption>
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-500">
              <th scope="col" className="py-1 pr-2">
                Componente
              </th>
              <th scope="col" className="py-1 pr-2">
                PGA oficial ({waveform.header.units})
              </th>
              <th scope="col" className="py-1 pr-2">
                PGA calculado ({waveform.header.units})
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPONENTS.map((component) => (
              <tr key={component.key} className="border-b border-gray-100">
                <th scope="row" className="py-1 pr-2 text-left font-mono">
                  {component.label} ({component.description})
                </th>
                <td className="py-1 pr-2 font-mono">
                  {waveform.header.pga[component.key].toFixed(4)}
                </td>
                <td className="py-1 pr-2 font-mono">
                  {waveform.computedPga[component.key].toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
