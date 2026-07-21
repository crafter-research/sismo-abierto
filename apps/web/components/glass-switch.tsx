"use client";

import { useEffect, useRef, useState } from "react";
import { Glass } from "./glass";

const LENS = { lensW: 22, lensH: 22, borderRadius: 11, depth: 6, domeDepth: 6 };
const TRACK_W = 46;
const PAD = 8;
const TRACK_H = 26;
const THUMB = 22;
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

export interface GlassSwitchProps {
  name: string;
  label: string;
  defaultChecked: boolean;
  value?: string;
  submitOnChange?: boolean;
}

export function GlassSwitch({
  name,
  label,
  defaultChecked,
  value = "1",
  submitOnChange = true,
}: GlassSwitchProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const [progress, setProgress] = useState(defaultChecked ? 1 : 0);
  const [pressed, setPressed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<number | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const from = progressRef.current;
    const to = checked ? 1 : 0;
    if (from === to) return;
    const duration = 180;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = cubicBezier(t, EASE);
      const next = from + (to - from) * eased;
      progressRef.current = next;
      setProgress(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [checked]);

  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-gray-900">{label}</span>
      <span
        className="group relative inline-block"
        style={{ width: TRACK_W, height: TRACK_H }}
      >
        <div className="absolute inset-0 rounded-full bg-gray-300" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ inset: -PAD }}
        >
          <Glass
            lens={LENS}
            x={0.2 + 0.6 * progress}
            strength={0.22}
            chroma={0.25}
            blur={0.25}
            className="h-full w-full"
          >
            <div className="h-full w-full" style={{ padding: PAD }}>
              <div className="relative h-full w-full">
                <div
                  className="absolute inset-0 rounded-full bg-gray-1000 transition-opacity duration-200 dark:bg-gray-600"
                  style={{ opacity: checked ? 1 : 0 }}
                />
              </div>
            </div>
          </Glass>
        </div>
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 rounded-full border transition-[background-color,backdrop-filter,border-color,box-shadow] duration-200 group-focus-within:ring-2 group-focus-within:ring-gray-1000 group-focus-within:ring-offset-2 group-focus-within:ring-offset-background-100 ${
            pressed
              ? "border-black/15 bg-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.08)] backdrop-blur-0 dark:border-white/30 dark:bg-white/10"
              : "border-black/10 bg-white/75 shadow-[0_1px_2px_rgba(0,0,0,0.10),0_4px_10px_rgba(0,0,0,0.18)] backdrop-blur-[2px] dark:border-white/20 dark:bg-white/85"
          }`}
          style={{
            width: THUMB,
            height: THUMB,
            left: `calc(${progress} * (100% - ${THUMB}px))`,
            transform: "translateY(-50%)",
          }}
        />
        <input
          ref={inputRef}
          type="checkbox"
          name={name}
          value={value}
          defaultChecked={defaultChecked}
          aria-label={label}
          onChange={(changeEvent) => {
            const nextChecked = changeEvent.target.checked;
            setChecked(nextChecked);
            if (submitOnChange) {
              changeEvent.currentTarget.form?.requestSubmit();
            }
          }}
          onPointerDown={() => setPressed(true)}
          onPointerCancel={() => setPressed(false)}
          onPointerUp={() => setPressed(false)}
          onBlur={() => setPressed(false)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
    </label>
  );
}
