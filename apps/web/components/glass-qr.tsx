"use client";

import qrcode from "qrcode-generator";
import { useEffect, useRef } from "react";
import { generateLensMap } from "../lib/glass/map";

export interface GlassQrProps {
  value: string;
  size?: number;
  label?: string;
}

const QUIET_MODULES = 4;
const CHROMA = 0.35;
const DISPLACE_SCALE = 0.12;
const SPRING_STIFFNESS = 200;
const SPRING_DAMPING = 18;
const REDUCED_MOTION_MS = 120;

const VERTEX_SRC = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_src;
uniform sampler2D u_map;
uniform float u_amount;
uniform float u_chroma;

void main() {
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  vec3 mapSample = texture(u_map, uv).rgb;
  vec2 offset = (mapSample.rg - 0.5) * u_amount * ${DISPLACE_SCALE.toFixed(4)};
  float spec = max(0.0, mapSample.b * 2.0 - 1.0) * u_amount;

  float r = texture(u_src, uv + offset * (1.0 + 0.2 * u_chroma)).r;
  float g = texture(u_src, uv + offset * (1.0 + 0.1 * u_chroma)).g;
  float b = texture(u_src, uv + offset).b;

  vec3 color = vec3(r, g, b) + vec3(spec);
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function createTexture(gl: WebGL2RenderingContext): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

function drawQrToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  pixelSize: number,
  darkColor: string,
  lightColor: string,
): void {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const moduleCount = qr.getModuleCount();
  const totalModules = moduleCount + QUIET_MODULES * 2;
  const moduleSize = pixelSize / totalModules;

  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, pixelSize, pixelSize);
  ctx.fillStyle = darkColor;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.isDark(row, col)) continue;
      const x = (col + QUIET_MODULES) * moduleSize;
      const y = (row + QUIET_MODULES) * moduleSize;
      ctx.fillRect(
        Math.floor(x),
        Math.floor(y),
        Math.ceil(moduleSize),
        Math.ceil(moduleSize),
      );
    }
  }
}

export function GlassQr({
  value,
  size = 160,
  label = "Código QR del enlace permanente",
}: GlassQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const srcTextureRef = useRef<WebGLTexture | null>(null);
  const mapTextureRef = useRef<WebGLTexture | null>(null);
  const mapReadyRef = useRef(false);

  const amountRef = useRef(0);
  const velocityRef = useRef(0);
  const targetRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pixelSize = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    if (!qrCanvasRef.current) {
      qrCanvasRef.current = document.createElement("canvas");
    }
    const qrCanvas = qrCanvasRef.current;

    const styles = getComputedStyle(document.documentElement);
    const darkColor = styles.getPropertyValue("--color-gray-1000").trim();
    const lightColor = styles.getPropertyValue("--color-background-100").trim();
    drawQrToCanvas(qrCanvas, value, pixelSize, darkColor, lightColor);

    const gl = canvas.getContext("webgl2");
    canvas.width = pixelSize;
    canvas.height = pixelSize;

    if (!gl) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(qrCanvas, 0, 0);
      return;
    }

    const program = createProgram(gl);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const srcTexture = createTexture(gl);
    srcTextureRef.current = srcTexture;
    gl.bindTexture(gl.TEXTURE_2D, srcTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      qrCanvas,
    );

    const mapTexture = createTexture(gl);
    mapTextureRef.current = mapTexture;
    mapReadyRef.current = false;

    const lensSize = pixelSize * 0.94;
    const mapUrl = generateLensMap({
      lensW: lensSize,
      lensH: lensSize,
      borderRadius: lensSize * 0.18,
      depth: pixelSize * 0.06,
      domeDepth: pixelSize * 0.12,
    });

    let cancelled = false;
    const mapImage = new Image();
    mapImage.onload = () => {
      if (cancelled) return;
      gl.bindTexture(gl.TEXTURE_2D, mapTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        mapImage,
      );
      mapReadyRef.current = true;
      render();
    };
    mapImage.src = mapUrl;

    const uSrcLocation = gl.getUniformLocation(program, "u_src");
    const uMapLocation = gl.getUniformLocation(program, "u_map");
    const uAmountLocation = gl.getUniformLocation(program, "u_amount");
    const uChromaLocation = gl.getUniformLocation(program, "u_chroma");

    function render() {
      if (!gl || !program) return;
      gl.viewport(0, 0, pixelSize, pixelSize);
      // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is the WebGL2 API method, not a React hook
      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, srcTextureRef.current);
      gl.uniform1i(uSrcLocation, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, mapTextureRef.current);
      gl.uniform1i(uMapLocation, 1);

      gl.uniform1f(
        uAmountLocation,
        mapReadyRef.current ? amountRef.current : 0,
      );
      gl.uniform1f(uChromaLocation, CHROMA);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    render();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    function tick(now: number) {
      frameRef.current = null;
      const last = lastTimeRef.current || now;
      const dt = Math.min(0.05, (now - last) / 1000);
      lastTimeRef.current = now;

      if (reduceMotion) {
        const step = dt / (REDUCED_MOTION_MS / 1000);
        const diff = targetRef.current - amountRef.current;
        amountRef.current += diff * Math.min(1, step);
        if (Math.abs(diff) < 0.001) amountRef.current = targetRef.current;
      } else {
        const displacement = amountRef.current - targetRef.current;
        const springForce = -SPRING_STIFFNESS * displacement;
        const dampingForce = -SPRING_DAMPING * velocityRef.current;
        const acceleration = springForce + dampingForce;
        velocityRef.current += acceleration * dt;
        amountRef.current += velocityRef.current * dt;
      }

      render();

      const settled =
        Math.abs(amountRef.current - targetRef.current) < 0.001 &&
        Math.abs(velocityRef.current) < 0.001;

      if (!settled) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        amountRef.current = targetRef.current;
        velocityRef.current = 0;
        render();
      }
    }

    function requestTick() {
      if (frameRef.current === null) {
        lastTimeRef.current = 0;
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    function setTarget(next: number) {
      targetRef.current = next;
      requestTick();
    }

    const pointerDown = () => setTarget(1);
    const pointerUp = () => setTarget(0);

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointerleave", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);

    const rootObserver = new MutationObserver(() => {
      const nextStyles = getComputedStyle(document.documentElement);
      const nextDark = nextStyles.getPropertyValue("--color-gray-1000").trim();
      const nextLight = nextStyles
        .getPropertyValue("--color-background-100")
        .trim();
      drawQrToCanvas(qrCanvas, value, pixelSize, nextDark, nextLight);
      gl.bindTexture(gl.TEXTURE_2D, srcTextureRef.current);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        qrCanvas,
      );
      render();
    });
    rootObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelled = true;
      rootObserver.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointerleave", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      gl.deleteTexture(srcTextureRef.current);
      gl.deleteTexture(mapTextureRef.current);
      gl.deleteBuffer(positionBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
  }, [value, size]);

  return (
    <div
      role="img"
      aria-label={label}
      className="inline-flex cursor-pointer rounded-xl border border-gray-300 bg-background-100 p-3"
    >
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
}
