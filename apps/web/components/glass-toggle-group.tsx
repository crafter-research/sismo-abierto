"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Glass } from "./glass";

const GLIDE_MS = 220;
const EASE = [0.175, 0.885, 0.32, 1.1] as const;

function cubicBezier(t: number, [x1, y1, x2, y2]: readonly number[]): number {
  const cx = 3 * (x1 ?? 0);
  const bx = 3 * ((x2 ?? 0) - (x1 ?? 0)) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * (y1 ?? 0);
  const by = 3 * ((y2 ?? 0) - (y1 ?? 0)) - cy;
  const ay = 1 - cy - by;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  const sampleDerivativeX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleX(u) - t;
    const derivative = sampleDerivativeX(u);
    if (Math.abs(derivative) < 1e-6) break;
    u -= x / derivative;
  }
  return sampleY(u);
}

export interface GlassToggleGroupOption {
  value: string;
  label: string;
}

export interface GlassToggleGroupProps {
  name: string;
  legend: string;
  options: GlassToggleGroupOption[];
  defaultValue: string;
  submitOnChange?: boolean;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function GlassToggleGroup({
  name,
  legend,
  options,
  defaultValue,
  submitOnChange = true,
}: GlassToggleGroupProps) {
  const reactId = useId();
  const containerRef = useRef<HTMLFieldSetElement>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const frameRef = useRef<number | null>(null);

  const defaultIndex = Math.max(
    0,
    options.findIndex((option) => option.value === defaultValue),
  );
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const [progress, setProgress] = useState(defaultIndex);
  const progressRef = useRef(defaultIndex);
  const [containerWidth, setContainerWidth] = useState(0);

  const optionCount = options.length;
  const optionWidth = containerWidth / optionCount;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setContainerWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = selectedIndex;
    const from = progressRef.current;
    if (from === target) return;

    if (prefersReducedMotion()) {
      progressRef.current = target;
      setProgress(target);
      return;
    }

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const startedAt = performance.now();

    const step = (time: number) => {
      const t = Math.min(1, (time - startedAt) / GLIDE_MS);
      const next = from + (target - from) * cubicBezier(t, EASE);
      progressRef.current = next;
      setProgress(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [selectedIndex]);

  const lensX = optionCount > 1 ? progress / (optionCount - 1) : 0;
  const pillWidth = Math.max(0, optionWidth - 6);
  const pillLeft = progress * optionWidth + 3;

  return (
    <fieldset
      ref={containerRef}
      className="relative grid h-9 rounded-lg border border-gray-300 bg-background-200 focus-within:ring-2 focus-within:ring-gray-1000 focus-within:ring-offset-2 focus-within:ring-offset-background-100"
      style={{ gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))` }}
    >
      <legend className="sr-only">{legend}</legend>
      <div aria-hidden="true" className="absolute inset-0">
        <Glass
          className="h-full"
          lens={{
            lensW: pillWidth,
            lensH: 30,
            borderRadius: 8,
            depth: 7,
            domeDepth: 5,
          }}
          x={lensX}
          strength={0.07}
          chroma={0.15}
          blur={0.15}
        >
          <div className="relative h-full">
            <div
              className="absolute inset-y-[3px] rounded-md bg-gray-1000"
              style={{ left: pillLeft, width: pillWidth }}
            />
          </div>
        </Glass>
      </div>
      {options.map((option, index) => {
        const inputId = `${reactId}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={`relative z-10 flex cursor-pointer select-none items-center justify-center whitespace-nowrap px-3 text-sm transition-colors duration-150 ${
              index === selectedIndex ? "text-background-100" : "text-gray-900"
            }`}
          >
            <input
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              id={inputId}
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={index === defaultIndex}
              className="sr-only"
              onChange={() => {
                setSelectedIndex(index);
                if (submitOnChange) {
                  inputRefs.current[index]?.form?.requestSubmit();
                }
              }}
            />
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}
