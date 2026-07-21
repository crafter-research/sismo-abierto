"use client";

import { useEffect, useRef, useState } from "react";
import { Glass } from "./glass";

const CHART_WIDTH = 900;
const CHART_HEIGHT = 64;
const LENS_H = 56;
const LENS_BORDER_RADIUS = 12;
const LENS_DEPTH = 5;
const LENS_DOME_DEPTH = 3;
const ARROW_STEP = 2;
const ARROW_STEP_LARGE = 10;

export interface GlassScrubProps {
  series: number[];
  startPct: number;
  widthPct: number;
  durationSeconds: number;
  onStartChange: (startPct: number) => void;
  label: string;
}

function seriesPath(series: number[], peak: number): string {
  const scaleY = peak === 0 ? 1 : CHART_HEIGHT / 2 / peak;
  const stepX = CHART_WIDTH / (series.length - 1 || 1);
  return series
    .map((value, index) => {
      const x = (index * stepX).toFixed(2);
      const y = (CHART_HEIGHT / 2 - value * scaleY).toFixed(2);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join("");
}

function clampStart(startPct: number, widthPct: number): number {
  return Math.min(100 - widthPct, Math.max(0, startPct));
}

function formatSeconds(pct: number, durationSeconds: number): string {
  return `${((pct / 100) * durationSeconds).toFixed(1)} s`;
}

export function GlassScrub({
  series,
  startPct,
  widthPct,
  durationSeconds,
  onStartChange,
  label,
}: GlassScrubProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetPctRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => {
      setContainerWidth(Math.max(1, element.clientWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const peak = series.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  const maxStartPct = 100 - widthPct;
  const lensW = (widthPct / 100) * containerWidth;
  const x = maxStartPct <= 0 ? 0 : startPct / maxStartPct;

  const pctFromClientX = (clientX: number): number => {
    const element = containerRef.current;
    if (!element) return startPct;
    const rect = element.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
    return Math.min(100, Math.max(0, ratio * 100));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = containerRef.current;
    if (!element) return;
    element.setPointerCapture(event.pointerId);
    const pointerPct = pctFromClientX(event.clientX);
    const insideWindow =
      pointerPct >= startPct && pointerPct <= startPct + widthPct;
    dragOffsetPctRef.current = insideWindow
      ? pointerPct - startPct
      : widthPct / 2;
    setDragging(true);
    onStartChange(clampStart(pointerPct - dragOffsetPctRef.current, widthPct));
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const pointerPct = pctFromClientX(event.clientX);
    onStartChange(clampStart(pointerPct - dragOffsetPctRef.current, widthPct));
  };

  const releasePointer = () => {
    setDragging(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? ARROW_STEP_LARGE : ARROW_STEP;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onStartChange(clampStart(startPct - step, widthPct));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onStartChange(clampStart(startPct + step, widthPct));
    } else if (event.key === "Home") {
      event.preventDefault();
      onStartChange(0);
    } else if (event.key === "End") {
      event.preventDefault();
      onStartChange(maxStartPct);
    }
  };

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={maxStartPct}
      aria-valuenow={startPct}
      aria-valuetext={`desde ${formatSeconds(startPct, durationSeconds)} hasta ${formatSeconds(startPct + widthPct, durationSeconds)} de ${durationSeconds.toFixed(1)} s`}
      className="relative h-16 w-full cursor-ew-resize touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={releasePointer}
      onPointerCancel={releasePointer}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Glass
        lens={{
          lensW: Math.max(1, lensW),
          lensH: LENS_H,
          borderRadius: LENS_BORDER_RADIUS,
          depth: LENS_DEPTH,
          domeDepth: LENS_DOME_DEPTH,
        }}
        strength={0.035}
        chroma={0.2}
        blur={0.2}
        x={x}
        className="h-16 w-full"
      >
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-16 w-full"
          aria-hidden="true"
        >
          <rect
            x={(startPct / 100) * CHART_WIDTH}
            y="0"
            width={(widthPct / 100) * CHART_WIDTH}
            height={CHART_HEIGHT}
            fill="var(--color-gray-1000)"
            opacity="0.05"
          />
          <line
            x1="0"
            y1={CHART_HEIGHT / 2}
            x2={CHART_WIDTH}
            y2={CHART_HEIGHT / 2}
            stroke="var(--color-gray-300)"
          />
          <path
            d={seriesPath(series, peak)}
            fill="none"
            stroke="var(--color-gray-600)"
            strokeWidth="1"
          />
        </svg>
      </Glass>
      <div
        aria-hidden="true"
        className={`scrub-handle pointer-events-none absolute top-1/2 h-14 rounded-[12px] border transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200 ${
          focused
            ? "ring-2 ring-gray-1000 ring-offset-2 ring-offset-background-100"
            : ""
        } ${
          widthPct >= 99.5
            ? "border-gray-400 bg-transparent backdrop-blur-0"
            : dragging
              ? "border-gray-1000/40 bg-transparent backdrop-blur-0"
              : "border-black/20 bg-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.10)] backdrop-blur-0 dark:border-white/30 dark:bg-white/5"
        }`}
        style={{
          left: `${startPct}%`,
          width: `${widthPct}%`,
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
}
