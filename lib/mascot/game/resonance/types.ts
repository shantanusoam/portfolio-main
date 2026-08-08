/**
 * Resonance Weaver / hero-fracture contracts — V2 §13, §19, §32.
 * Simulation-only: no React imports.
 */

export type HeroProxyType =
  | "letter"
  | "word"
  | "bar"
  | "string"
  | "dot"
  | "buttonEdge"
  | "decorativeLine";

/**
 * Canvas-authoritative hero fragment after snapshot (V2 §13).
 * Geometry is measured once at transition start — never via DOM in the loop.
 */
export interface HeroProxyObject {
  id: string;
  /** Live element at snapshot; nulled after adopt so the loop never measures. */
  sourceElement: HTMLElement | null;
  type: HeroProxyType;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  angularVelocity: number;
  width: number;
  height: number;
  opacity: number;
  collected: boolean;
  /** Cached label at snapshot — never re-measureText for layout. */
  label: string;
  /** Cached fill at snapshot for simple canvas draw. */
  fillStyle: string;
}

export type FracturePhase =
  | "idle"
  | "tension"
  | "snap"
  | "unlock"
  | "falling"
  | "playing"
  | "restore"
  | "done";

/**
 * Stub Weaver game state for the game engineer to fill (bounce/weave/collect).
 * Fracture handoff only needs phase + proxy bookkeeping.
 */
export interface WeaverGameState {
  phase: FracturePhase;
  score: number;
  combo: number;
  collectedCount: number;
  targetCollectCount: number;
  elapsed: number;
}

export function createEmptyWeaverState(): WeaverGameState {
  return {
    phase: "idle",
    score: 0,
    combo: 0,
    collectedCount: 0,
    targetCollectCount: 0,
    elapsed: 0,
  };
}

/** Desktop / mobile proxy caps from V2 §49 (18–35). */
export const HERO_PROXY_CAP_DESKTOP = 32;
export const HERO_PROXY_CAP_MOBILE = 18;
export const HERO_PROXY_POOL_CAPACITY = 40;
