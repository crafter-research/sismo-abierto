"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { generateLensMap, type LensShape } from "../lib/glass/map";

export interface GlassProps {
  lens: LensShape;
  x: number;
  y?: number;
  strength?: number;
  chroma?: number;
  blur?: number;
  children: ReactNode;
  className?: string;
}

export function Glass({
  lens,
  x,
  y = 0.5,
  strength = 0.55,
  chroma = 0.4,
  blur = 0.5,
  children,
  className,
}: GlassProps) {
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [box, setBox] = useState({ w: 1, h: 1 });

  const shapeKey = JSON.stringify(lens);
  useEffect(() => {
    setMap(generateLensMap(JSON.parse(shapeKey) as LensShape));
    setVersion((current) => current + 1);
  }, [shapeKey]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => {
      setBox({
        w: Math.max(1, element.clientWidth),
        h: Math.max(1, element.clientHeight),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const filterId = `glass-${reactId}-v${version}`;
  const geometry = useMemo(() => {
    const lensWFrac = lens.lensW / box.w;
    const lensHFrac = lens.lensH / box.h;
    const centerX = x * (1 - lens.lensW / box.w) + lensWFrac / 2;
    return {
      x: Math.max(0, centerX - lensWFrac / 2),
      y: Math.max(0, y - lensHFrac / 2),
      width: Math.min(1, lensWFrac),
      height: Math.min(1, lensHFrac),
    };
  }, [lens.lensW, lens.lensH, box.w, box.h, x, y]);

  const scale = strength * (lens.lensW / box.w) * 0.5;
  const scaleR = scale * (1 + 0.2 * chroma);
  const scaleG = scale * (1 + 0.1 * chroma);
  const blurX = blur / box.w;
  const blurY = blur / box.h;
  const active = map !== null;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative" }}
    >
      <div style={active ? { filter: `url(#${filterId})` } : undefined}>
        {children}
      </div>
      {active ? (
        <svg
          width="0"
          height="0"
          style={{ position: "absolute" }}
          aria-hidden="true"
        >
          <filter
            id={filterId}
            filterUnits="objectBoundingBox"
            primitiveUnits="objectBoundingBox"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width="1"
            height="1"
          >
            <feFlood
              floodColor="rgb(128,128,128)"
              floodOpacity="1"
              result="mapBg"
            />
            <feImage
              href={map}
              preserveAspectRatio="none"
              result="rawMap"
              x={geometry.x}
              y={geometry.y}
              width={geometry.width}
              height={geometry.height}
            />
            <feComposite in="rawMap" in2="mapBg" operator="over" result="map" />
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={`${blurX} ${blurY}`}
              result="blurred"
            />
            <feDisplacementMap
              in="blurred"
              in2="map"
              scale={scaleR}
              xChannelSelector="R"
              yChannelSelector="G"
              x={geometry.x}
              y={geometry.y}
              width={geometry.width}
              height={geometry.height}
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="dispR"
            />
            <feDisplacementMap
              in="blurred"
              in2="map"
              scale={scaleG}
              xChannelSelector="R"
              yChannelSelector="G"
              x={geometry.x}
              y={geometry.y}
              width={geometry.width}
              height={geometry.height}
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="dispG"
            />
            <feDisplacementMap
              in="blurred"
              in2="map"
              scale={scale}
              xChannelSelector="R"
              yChannelSelector="G"
              x={geometry.x}
              y={geometry.y}
              width={geometry.width}
              height={geometry.height}
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="dispB"
            />
            <feComposite
              in="dispR"
              in2="dispG"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
            />
            <feComposite
              in2="dispB"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="lensResult"
            />
            <feColorMatrix
              in="map"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 -0.5019607843137255"
              result="specMask"
            />
            <feComposite
              in="specMask"
              in2="lensResult"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="lensFinal"
            />
            <feFlood
              floodColor="black"
              floodOpacity="1"
              result="lensMask"
              x={geometry.x}
              y={geometry.y}
              width={geometry.width}
              height={geometry.height}
            />
            <feComposite
              in="SourceGraphic"
              in2="lensMask"
              operator="out"
              result="holedSG"
            />
            <feComposite in="lensFinal" in2="holedSG" operator="over" />
          </filter>
        </svg>
      ) : null}
    </div>
  );
}
