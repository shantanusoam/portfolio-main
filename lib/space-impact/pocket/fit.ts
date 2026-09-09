import { ART_HEIGHT, ART_WIDTH, WORLD_PER_ART } from "./palette";

export const SIM_WIDTH = ART_WIDTH * WORLD_PER_ART; // 480
export const SIM_HEIGHT = ART_HEIGHT * WORLD_PER_ART; // 270

/**
 * Phone-first display fitting (Pocket Edition contract, section 3).
 *
 * F = min(availWidthCSS, availHeightCSS * 16/9). The largest integer
 * device-pixel enlargement k (1..6) is used only when the resulting CSS
 * world width reaches at least 85% of F and at least 267 CSS px.
 * Otherwise a deliberate nearest-neighbor fit to F is used.
 */
export interface FitResult {
  mode: "integer" | "nearest";
  /** CSS px per art pixel. */
  cssScale: number;
  /** Device px per art pixel (integer mode only). */
  deviceScale: number;
  cssWidth: number;
  cssHeight: number;
  backingWidth: number;
  backingHeight: number;
  floorFailed: boolean;
}

export const READABILITY_FLOOR = 267;
export const MAX_INTEGER_ENLARGEMENT = 6;

export function computeFit(
  availableWidth: number,
  availableHeight: number,
  dpr: number,
): FitResult {
  const ratio = Math.max(0.5, dpr);
  const targetF = Math.max(0, Math.min(availableWidth, availableHeight * 16 / 9));
  let best: FitResult | null = null;
  for (let k = MAX_INTEGER_ENLARGEMENT; k >= 1; k--) {
    const cssWidth = (ART_WIDTH * k) / ratio;
    const cssHeight = (ART_HEIGHT * k) / ratio;
    if (cssWidth > availableWidth || cssHeight > availableHeight) continue;
    if (cssWidth < 0.85 * targetF || cssWidth < READABILITY_FLOOR) continue;
    best = {
      mode: "integer",
      cssScale: cssWidth / ART_WIDTH,
      deviceScale: k,
      cssWidth,
      cssHeight,
      backingWidth: ART_WIDTH * k,
      backingHeight: ART_HEIGHT * k,
      floorFailed: false,
    };
    break;
  }
  if (best) return best;
  const cssWidth = Math.min(targetF, availableWidth);
  const cssHeight = cssWidth * 9 / 16;
  return {
    mode: "nearest",
    cssScale: cssWidth / ART_WIDTH,
    deviceScale: 0,
    cssWidth,
    cssHeight,
    backingWidth: Math.max(1, Math.round(cssWidth * ratio)),
    backingHeight: Math.max(1, Math.round(cssHeight * ratio)),
    floorFailed: targetF < READABILITY_FLOOR,
  };
}

/**
 * Pointer mapping uses the displayed world rectangle only. Neither the art
 * width nor backing-buffer dimensions belong in pointer math.
 */
export function clientToWorld(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  return {
    x: ((clientX - rect.left) * SIM_WIDTH) / rect.width,
    y: ((clientY - rect.top) * SIM_HEIGHT) / rect.height,
  };
}
