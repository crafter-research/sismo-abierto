"use client";

import { useRef, useState } from "react";
import { Glass } from "./glass";

const LENS = { lensW: 44, lensH: 26, borderRadius: 13, depth: 8, domeDepth: 7 };

export interface GlassRangeProps {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  prefix?: string;
}

export function GlassRange({
  name,
  label,
  min,
  max,
  step,
  defaultValue,
  prefix = "",
}: GlassRangeProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const progress = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const display = `${prefix}${value.toFixed(1)}`;

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-baseline justify-between text-gray-900">
        <span>{label}</span>
        <output className="font-mono text-[13px] text-gray-1000">
          {display}
        </output>
      </span>
      <div className="group relative h-10">
        <Glass lens={LENS} x={progress} strength={0.5} chroma={0.35} blur={0.4}>
          <div className="flex h-10 items-center px-1">
            <div className="relative h-[5px] w-full overflow-hidden rounded-full bg-gray-300">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gray-1000"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </Glass>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 h-[26px] w-[44px] rounded-[13px] border border-black/10 bg-white/75 shadow-[0_1px_2px_rgba(0,0,0,0.10),0_4px_10px_rgba(0,0,0,0.18)] backdrop-blur-[2px] transition-shadow group-focus-within:ring-2 group-focus-within:ring-gray-1000 group-focus-within:ring-offset-2 group-focus-within:ring-offset-background-100 dark:border-white/20 dark:bg-white/85"
          style={{
            left: `calc(${progress} * (100% - 44px))`,
            transform: "translateY(-50%)",
          }}
        />
        <input
          ref={inputRef}
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(changeEvent) => setValue(Number(changeEvent.target.value))}
          onPointerUp={() => inputRef.current?.form?.requestSubmit()}
          onKeyUp={(keyEvent) => {
            if (
              [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
              ].includes(keyEvent.key)
            ) {
              inputRef.current?.form?.requestSubmit();
            }
          }}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </label>
  );
}
