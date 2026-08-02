"use client";

import type { WaveformView } from "@sismo/contracts";
import { useId, useState } from "react";
import { ClassBadge } from "./badges";
import { GlassScrub } from "./glass-scrub";

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
const SPECTRUM_HEIGHT = 160;
const SPECTROGRAM_HEIGHT = 240;

type ComponentKey = "z" | "n" | "e";

function spectrumPath(frequencies: number[], amplitudes: number[]): string {
  const maxFrequency = frequencies.at(-1) ?? 1;
  const maxAmplitude = Math.max(...amplitudes, 1e-12);
  return amplitudes
    .map((amplitude, index) => {
      const x = ((frequencies[index] ?? 0) / maxFrequency) * CHART_WIDTH;
      const y = SPECTRUM_HEIGHT - (amplitude / maxAmplitude) * SPECTRUM_HEIGHT;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join("");
}

function dominantSpectrumBin(
  frequencies: number[],
  amplitudes: number[],
): { frequencyHz: number; amplitude: number } {
  let peakIndex = amplitudes.length > 1 ? 1 : 0;
  for (let index = peakIndex + 1; index < amplitudes.length; index++) {
    if ((amplitudes[index] ?? 0) > (amplitudes[peakIndex] ?? 0)) {
      peakIndex = index;
    }
  }
  return {
    frequencyHz: frequencies[peakIndex] ?? 0,
    amplitude: amplitudes[peakIndex] ?? 0,
  };
}

function spectrogramPeak(
  timesSeconds: number[],
  frequenciesHz: number[],
  powerDb: number[][],
) {
  let peakTimeIndex = 0;
  let peakFrequencyIndex = 0;
  let peak = Number.NEGATIVE_INFINITY;
  for (let timeIndex = 0; timeIndex < powerDb.length; timeIndex++) {
    const frame = powerDb[timeIndex] ?? [];
    for (
      let frequencyIndex = 0;
      frequencyIndex < frame.length;
      frequencyIndex++
    ) {
      if ((frame[frequencyIndex] ?? Number.NEGATIVE_INFINITY) > peak) {
        peak = frame[frequencyIndex] as number;
        peakTimeIndex = timeIndex;
        peakFrequencyIndex = frequencyIndex;
      }
    }
  }
  return {
    timeSeconds: timesSeconds[peakTimeIndex] ?? 0,
    frequencyHz: frequenciesHz[peakFrequencyIndex] ?? 0,
  };
}

function powerColor(value: number, minDb: number, maxDb: number): string {
  const normalized = Math.max(
    0,
    Math.min(1, (value - minDb) / (maxDb - minDb || 1)),
  );
  const hue = 235 - normalized * 205;
  const lightness = 16 + normalized * 48;
  return `hsl(${hue.toFixed(0)} 82% ${lightness.toFixed(0)}%)`;
}

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
  const [widthPct, setWidthPct] = useState(40);
  const [frequencyComponent, setFrequencyComponent] =
    useState<ComponentKey>("z");
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
            <span className="text-gray-800">{component.description}</span>
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
              <figcaption className="mb-1 flex items-baseline gap-3 text-xs text-gray-900">
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
        <legend className="px-1 text-xs font-semibold uppercase text-gray-800">
          Zoom horizontal compartido
        </legend>
        <GlassScrub
          series={waveform.reducedComponents.n}
          startPct={startPct}
          widthPct={widthPct}
          durationSeconds={durationSeconds}
          onStartChange={setStartPct}
          label="Ventana de zoom sobre la señal completa"
        />
        <details className="mt-3">
          <summary className="cursor-pointer text-gray-900 text-xs">
            Control fino de la ventana
          </summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
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
        </details>
      </fieldset>

      <section
        aria-labelledby="frequency-analysis-title"
        className="space-y-4 border-gray-200 border-t pt-4"
        data-testid="frequency-analysis"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="frequency-analysis-title" className="font-semibold">
              Análisis de frecuencia
            </h3>
            <ClassBadge value="derived" />
          </div>
          <p className="mt-1 text-sm text-gray-900">
            Fourier separa la señal por frecuencias. El espectrograma muestra
            cómo cambia su energía relativa a lo largo del registro.
          </p>
        </div>

        <label className="flex w-fit flex-col gap-1 text-sm">
          <span className="text-gray-900">Componente mostrada</span>
          <select
            value={frequencyComponent}
            onChange={(event) =>
              setFrequencyComponent(event.target.value as ComponentKey)
            }
            className="rounded border border-gray-300 px-2 py-1.5 font-mono text-sm"
          >
            {COMPONENTS.map((component) => (
              <option key={component.key} value={component.key}>
                {component.label} · {component.description}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 text-xs text-gray-900 sm:grid-cols-2 lg:grid-cols-4">
          <p>
            Espectro: ventana Hann de{" "}
            <span className="font-mono">
              {waveform.frequencyAnalysis.spectrum.windowSizeSamples} muestras
            </span>
          </p>
          <p>
            Superposición:{" "}
            <span className="font-mono">
              {waveform.frequencyAnalysis.spectrum.overlapSamples} muestras
            </span>
          </p>
          <p>
            Resolución:{" "}
            <span className="font-mono">
              {waveform.frequencyAnalysis.spectrum.frequencyResolutionHz} Hz
            </span>
          </p>
          <p>
            Nyquist:{" "}
            <span className="font-mono">
              {(waveform.header.sampleRateHz / 2).toFixed(1)} Hz
            </span>
          </p>
        </div>

        <figure data-testid="frequency-spectrum">
          <figcaption className="mb-1 text-xs text-gray-900">
            Espectro de Fourier · componente {frequencyComponent.toUpperCase()}{" "}
            · amplitud en {waveform.frequencyAnalysis.spectrum.amplitudeUnit}
          </figcaption>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${SPECTRUM_HEIGHT}`}
            role="img"
            aria-label={`Espectro de Fourier de la componente ${frequencyComponent.toUpperCase()}, de 0 a ${waveform.header.sampleRateHz / 2} Hz. Alternativa tabular disponible debajo.`}
            className="h-36 w-full rounded border border-gray-200 bg-background-100"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1={SPECTRUM_HEIGHT}
              x2={CHART_WIDTH}
              y2={SPECTRUM_HEIGHT}
              stroke="var(--color-gray-300)"
            />
            <path
              d={spectrumPath(
                waveform.frequencyAnalysis.spectrum.frequenciesHz,
                waveform.frequencyAnalysis.spectrum.amplitudes[
                  frequencyComponent
                ],
              )}
              fill="none"
              stroke="var(--color-gray-1000)"
              strokeWidth="1.5"
            />
          </svg>
          <div className="mt-1 flex justify-between font-mono text-[11px] text-gray-800">
            <span>0 Hz</span>
            <span>{(waveform.header.sampleRateHz / 2).toFixed(1)} Hz</span>
          </div>
        </figure>

        <figure data-testid="spectrogram">
          <figcaption className="mb-1 text-xs text-gray-900">
            Espectrograma · componente {frequencyComponent.toUpperCase()} · dB
            relativos al máximo de la componente
          </figcaption>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${SPECTROGRAM_HEIGHT}`}
            role="img"
            aria-label={`Espectrograma de la componente ${frequencyComponent.toUpperCase()}, tiempo en segundos y frecuencia en Hz. Alternativa tabular disponible debajo.`}
            className="h-48 w-full rounded border border-gray-200 bg-background-100"
            preserveAspectRatio="none"
          >
            {waveform.frequencyAnalysis.spectrogram.powerDb[
              frequencyComponent
            ].flatMap((frame, timeIndex, frames) =>
              frame.map((value, frequencyIndex) => {
                const width = CHART_WIDTH / frames.length;
                const height = SPECTROGRAM_HEIGHT / frame.length;
                return (
                  <rect
                    key={`${waveform.frequencyAnalysis.spectrogram.timesSeconds[timeIndex]}-${waveform.frequencyAnalysis.spectrogram.frequenciesHz[frequencyIndex]}`}
                    x={timeIndex * width}
                    y={SPECTROGRAM_HEIGHT - (frequencyIndex + 1) * height}
                    width={width + 0.2}
                    height={height + 0.2}
                    fill={powerColor(
                      value,
                      waveform.frequencyAnalysis.spectrogram.minDb,
                      waveform.frequencyAnalysis.spectrogram.maxDb,
                    )}
                  />
                );
              }),
            )}
          </svg>
          <div className="mt-1 flex justify-between font-mono text-[11px] text-gray-800">
            <span>
              {waveform.frequencyAnalysis.spectrogram.timesSeconds[0]?.toFixed(
                1,
              ) ?? "0.0"}{" "}
              s
            </span>
            <span>
              {waveform.frequencyAnalysis.spectrogram.timesSeconds
                .at(-1)
                ?.toFixed(1) ?? "0.0"}{" "}
              s
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-900">
            Ventana Hann de{" "}
            <span className="font-mono">
              {waveform.frequencyAnalysis.spectrogram.windowSizeSamples}{" "}
              muestras
            </span>
            , 50% de superposición, resolución temporal de{" "}
            <span className="font-mono">
              {waveform.frequencyAnalysis.spectrogram.timeResolutionSeconds} s
            </span>{" "}
            y resolución espectral de{" "}
            <span className="font-mono">
              {waveform.frequencyAnalysis.spectrogram.frequencyResolutionHz} Hz
            </span>
            .
          </p>
        </figure>

        <details className="rounded border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Alternativa tabular del análisis de frecuencia
          </summary>
          <table className="mt-2 w-full text-sm" data-testid="frequency-table">
            <caption className="sr-only">
              Picos derivados del espectro y espectrograma por componente
            </caption>
            <thead>
              <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
                <th scope="col" className="py-1 pr-2">
                  Componente
                </th>
                <th scope="col" className="py-1 pr-2">
                  Frecuencia dominante
                </th>
                <th scope="col" className="py-1 pr-2">
                  Amplitud espectral
                </th>
                <th scope="col" className="py-1">
                  Pico del espectrograma
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPONENTS.map((component) => {
                const dominant = dominantSpectrumBin(
                  waveform.frequencyAnalysis.spectrum.frequenciesHz,
                  waveform.frequencyAnalysis.spectrum.amplitudes[component.key],
                );
                const peak = spectrogramPeak(
                  waveform.frequencyAnalysis.spectrogram.timesSeconds,
                  waveform.frequencyAnalysis.spectrogram.frequenciesHz,
                  waveform.frequencyAnalysis.spectrogram.powerDb[component.key],
                );
                return (
                  <tr key={component.key} className="border-b border-gray-100">
                    <th scope="row" className="py-1 pr-2 text-left font-mono">
                      {component.label}
                    </th>
                    <td className="py-1 pr-2 font-mono">
                      {dominant.frequencyHz.toFixed(2)} Hz
                    </td>
                    <td className="py-1 pr-2 font-mono">
                      {dominant.amplitude.toFixed(4)}{" "}
                      {waveform.frequencyAnalysis.spectrum.amplitudeUnit}
                    </td>
                    <td className="py-1 font-mono">
                      {peak.frequencyHz.toFixed(2)} Hz a{" "}
                      {peak.timeSeconds.toFixed(2)} s
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </details>
      </section>

      <details className="rounded border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Alternativa tabular accesible de las gráficas
        </summary>
        <p className="mt-2 text-xs text-gray-900">
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
            <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
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
