"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Glass } from "./glass";

const SPRING_STIFFNESS = 170;
const SPRING_DAMPING = 22;
const SPRING_MASS = 1;
const SPRING_SETTLE_EPSILON = 0.001;

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
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);

  const defaultIndex = Math.max(
    0,
    options.findIndex((option) => option.value === defaultValue),
  );
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const [progress, setProgress] = useState(defaultIndex);
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

    if (prefersReducedMotion()) {
      setProgress(target);
      return;
    }

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    lastTimeRef.current = performance.now();

    const step = (time: number) => {
      const deltaSeconds = Math.min(0.032, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      setProgress((current) => {
        const displacement = current - target;
        const springForce = -SPRING_STIFFNESS * displacement;
        const dampingForce = -SPRING_DAMPING * velocityRef.current;
        const acceleration = (springForce + dampingForce) / SPRING_MASS;
        const nextVelocity = velocityRef.current + acceleration * deltaSeconds;
        const next = current + nextVelocity * deltaSeconds;
        velocityRef.current = nextVelocity;

        const settled =
          Math.abs(next - target) < SPRING_SETTLE_EPSILON &&
          Math.abs(nextVelocity) < SPRING_SETTLE_EPSILON;

        if (settled) {
          frameRef.current = null;
          velocityRef.current = 0;
          return target;
        }

        frameRef.current = requestAnimationFrame(step);
        return next;
      });
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
