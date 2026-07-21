export interface LensShape {
  lensW: number;
  lensH: number;
  borderRadius: number;
  depth?: number;
  domeDepth?: number;
  splay?: number;
  glowStrength?: number;
  glowSpread?: number;
  glowExponent?: number;
  edgeStrength?: number;
  edgeWidth?: number;
  edgeExponent?: number;
  specularRotation?: number;
  mapSize?: number;
}

const SQRT_PI = 1.7724538509;

function erf(x: number): number {
  return Math.tanh(SQRT_PI * x);
}

function meanDomeSlope(sphereRadius: number, half: number): number {
  let sum = 0;
  const STEPS = 200;
  for (let i = 0; i <= STEPS; i++) {
    const v = (i / STEPS) * half;
    const slope = v / Math.sqrt(sphereRadius * sphereRadius - v * v);
    sum += i === 0 || i === STEPS ? 0.5 * slope : slope;
  }
  return sum / STEPS;
}

function computeDomeConstants(domeDepth: number, halfW: number, halfH: number) {
  const cap = Math.max(0.01, Math.min(domeDepth, Math.min(halfW, halfH) - 1));
  const Rx = (halfW * halfW + cap * cap) / (2 * cap);
  const Ry = (halfH * halfH + cap * cap) / (2 * cap);
  const meanX = meanDomeSlope(Rx, halfW);
  const meanY = meanDomeSlope(Ry, halfH);
  return {
    Rx,
    Ry,
    scaleX: meanX > 0 ? 0.5 / meanX : 1,
    scaleY: meanY > 0 ? 0.5 / meanY : 1,
  };
}

function domeGradient(v: number, sphereRadius: number, scale: number): number {
  const clamped = Math.min(v, 0.999 * sphereRadius);
  return (
    (clamped / Math.sqrt(sphereRadius * sphereRadius - clamped * clamped)) *
    scale
  );
}

export function generateLensMap(shape: LensShape): string {
  const {
    lensW,
    lensH,
    borderRadius,
    depth = 10,
    domeDepth = 0,
    splay = 1,
    glowStrength = 0.1,
    glowSpread = 1,
    glowExponent = 1.5,
    edgeStrength = 0.25,
    edgeWidth = 3,
    edgeExponent = 1.5,
    specularRotation = 45,
    mapSize = 256,
  } = shape;

  const canvas = document.createElement("canvas");
  canvas.width = mapSize;
  canvas.height = mapSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const image = ctx.createImageData(mapSize, mapSize);
  const data = image.data;

  const halfW = lensW / 2;
  const halfH = lensH / 2;
  const half = mapSize >> 1;
  const radius = Math.min(borderRadius, Math.min(halfW, halfH));
  const innerW = Math.max(0, halfW - depth);
  const innerH = Math.max(0, halfH - depth);
  const innerRadius = Math.max(
    0,
    Math.min(borderRadius, Math.min(innerW, innerH)),
  );
  const invSigma = depth > 0 ? 1 / (depth * Math.SQRT2) : 1e6;
  const hasSpecular = glowStrength > 0 || edgeStrength > 0;
  const angle = (specularRotation * Math.PI) / 180;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const glowLow = (1 - glowSpread) * Math.SQRT2;
  const glowRange = glowSpread * Math.SQRT2;
  const invGlowRange = glowRange > 0.001 ? 1 / glowRange : 0;
  const invEdgeWidth = edgeWidth > 0 ? 1 / edgeWidth : 0;
  const pxToLensX = (2 * halfW) / mapSize;
  const pxToLensY = (2 * halfH) / mapSize;
  const dome =
    domeDepth > 0 ? computeDomeConstants(domeDepth, halfW, halfH) : null;
  const splayActive = splay < 1;
  const splayBand = 0.5 * Math.min(halfW, halfH);
  const invSplayBand = splayBand > 0 ? 1 / splayBand : 0;

  for (let row = 0; row < half; row++) {
    const mirrorRow = mapSize - 1 - row;
    const y = -((row + 0.5) * pxToLensY - halfH);
    const yEdge = y - halfH + radius;
    const yInnerEdge = y - innerH + innerRadius;
    const gradYBase = dome
      ? domeGradient(y, dome.Ry, dome.scaleY)
      : Math.min(1, y / halfH);
    const normY = Math.min(1, y / halfH);
    const splayY = splayActive
      ? Math.max(0, 1 - (halfH - y) * invSplayBand)
      : 0;

    for (let col = 0; col < half; col++) {
      const mirrorCol = mapSize - 1 - col;
      const x = -((col + 0.5) * pxToLensX - halfW);
      const xEdge = x - halfW + radius;

      const dx = Math.max(xEdge, 0);
      const dy = Math.max(yEdge, 0);
      const outside = Math.sqrt(dx * dx + dy * dy);
      const sdf = outside + Math.min(Math.max(xEdge, yEdge), 0) - radius;

      const iTL = (row * mapSize + col) * 4;
      const iTR = (row * mapSize + mirrorCol) * 4;
      const iBL = (mirrorRow * mapSize + col) * 4;
      const iBR = (mirrorRow * mapSize + mirrorCol) * 4;

      if (sdf >= 0) {
        for (const i of [iTL, iTR, iBL, iBR]) {
          data[i] = 128;
          data[i + 1] = 128;
          data[i + 2] = 128;
          data[i + 3] = 255;
        }
        continue;
      }

      let gradX = dome
        ? domeGradient(x, dome.Rx, dome.scaleX)
        : Math.min(1, x / halfW);
      let gradY = gradYBase;

      if (splayActive) {
        const dampY = splayY * (1 - splay);
        const dampX = Math.max(0, 1 - (halfW - x) * invSplayBand) * (1 - splay);
        if (dampY > 0.001 || dampX > 0.001) {
          const rawX = gradX;
          const rawY = gradY;
          gradX = rawX * (1 - dampY);
          gradY = rawY * (1 - dampX);
          const rawMag = Math.sqrt(rawX * rawX + rawY * rawY);
          const newMag = Math.sqrt(gradX * gradX + gradY * gradY);
          if (newMag > 0.001) {
            const renorm = rawMag / newMag;
            gradX *= renorm;
            gradY *= renorm;
          }
        }
      }

      const ex = Math.max(x - innerW + innerRadius, 0);
      const ey = Math.max(yInnerEdge, 0);
      const innerSdf =
        Math.sqrt(ex * ex + ey * ey) +
        Math.min(Math.max(x - innerW + innerRadius, yInnerEdge), 0) -
        innerRadius;
      const falloff = 0.5 * (1 + erf(innerSdf * invSigma));

      const dispX = 0.5 * gradX * falloff;
      const dispY = 0.5 * gradY * falloff;
      const rPos = Math.round((0.5 + dispX) * 255);
      const rNeg = Math.round((0.5 - dispX) * 255);
      const gPos = Math.round((0.5 + dispY) * 255);
      const gNeg = Math.round((0.5 - dispY) * 255);

      let specTL = 128;
      let specTR = 128;
      let specBL = 128;
      let specBR = 128;
      if (hasSpecular) {
        const nx = Math.min(1, x / halfW) * dirX;
        const ny = normY * dirY;
        const alongPlus = Math.abs(nx + ny);
        const alongMinus = Math.abs(nx - ny);
        const edgeBand =
          edgeStrength > 0 ? Math.max(0, 1 + sdf * invEdgeWidth) : 0;
        const specFor = (along: number) => {
          let value = 0;
          if (glowStrength > 0) {
            const t = Math.min(
              1,
              Math.max(0, (along - glowLow) * invGlowRange),
            );
            value += glowStrength * t ** glowExponent * falloff;
          }
          if (edgeStrength > 0) {
            value += edgeStrength * edgeBand * along ** edgeExponent;
          }
          return Math.round(127 * Math.min(1, value) + 128);
        };
        specTL = specFor(alongPlus);
        specBR = specFor(alongPlus);
        specTR = specFor(alongMinus);
        specBL = specFor(alongMinus);
      }

      data[iTL] = rPos;
      data[iTL + 1] = gPos;
      data[iTL + 2] = specTL;
      data[iTL + 3] = 255;
      data[iTR] = rNeg;
      data[iTR + 1] = gPos;
      data[iTR + 2] = specTR;
      data[iTR + 3] = 255;
      data[iBL] = rPos;
      data[iBL + 1] = gNeg;
      data[iBL + 2] = specBL;
      data[iBL + 3] = 255;
      data[iBR] = rNeg;
      data[iBR + 1] = gNeg;
      data[iBR + 2] = specBR;
      data[iBR + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}
