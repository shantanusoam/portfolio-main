import { clamp } from "../core/NumericGuards";
import type { ResonanceGateState } from "../types";
import type { MusicalStringGeometry } from "./StringRegistry";

export type { ResonanceGateState };

/**
 * V2 Phase 5 foundation: string pull tension + slingshot-ready gate.
 *
 * Computes `pullTension = clamp(distance / MAX_STRING_PULL, 0, 1)` while
 * dragging in contact with / pulling a cached string. Exposes
 * `ResonanceGateState` fields and a pollable `consumeSlingshotTrigger()`
 * for the transition choreographer — does not start fracture itself.
 *
 * Geometry comes only from `StringRegistry` caches; never measures DOM.
 */

export interface StringTensionGateConfig {
  /** px — distance from string rest that maps to pullTension = 1. */
  maxStringPull: number;
  /** Vertical band around restY that counts as string contact / attach. */
  attachBand: number;
  /** pullTension threshold for a slingshot-ready release. */
  slingshotTensionThreshold: number;
  /** |releaseVelocity| (tension units / second) required on release. */
  slingshotReleaseVelocity: number;
  /** Seconds before another slingshot trigger can arm. */
  triggerCooldownSeconds: number;
  /** How quickly pullTension eases when not attached. */
  tensionDecayPerSecond: number;
}

export const DEFAULT_STRING_TENSION_GATE_CONFIG: StringTensionGateConfig = {
  maxStringPull: 110,
  attachBand: 28,
  slingshotTensionThreshold: 0.82,
  slingshotReleaseVelocity: 1.4,
  triggerCooldownSeconds: 2.5,
  tensionDecayPerSecond: 3.5,
};

export function computePullTension(
  distance: number,
  maxStringPull: number = DEFAULT_STRING_TENSION_GATE_CONFIG.maxStringPull,
): number {
  if (!Number.isFinite(distance) || !Number.isFinite(maxStringPull)) return 0;
  if (maxStringPull <= 0) return 0;
  return clamp(Math.abs(distance) / maxStringPull, 0, 1);
}

/**
 * Amplifies a contact intensity/velocity by current pull tension.
 * High tension → stronger STRING_CONTACT_EVENT bend signal.
 */
export function amplifyContactVelocity(
  baseVelocity: number,
  pullTension: number,
): number {
  const tension = clamp(pullTension, 0, 1);
  const base = clamp(baseVelocity, 0, 1);
  return clamp(base * (1 + tension * 1.35), 0, 1);
}

export function evaluateSlingshotReady(
  state: ResonanceGateState,
  config: {
    slingshotTensionThreshold: number;
    slingshotReleaseVelocity: number;
  },
): boolean {
  return (
    state.attachedToString &&
    state.pointerReleased &&
    state.pullTension > config.slingshotTensionThreshold &&
    Math.abs(state.releaseVelocity) >= config.slingshotReleaseVelocity &&
    state.triggerCooldown <= 0
  );
}

export interface StringTensionUpdateInput {
  dt: number;
  pointerActive: boolean;
  pointerX: number;
  pointerY: number;
  rootX: number;
  rootY: number;
  strings: readonly MusicalStringGeometry[];
  /** True on frames where a swept contact just fired against some string. */
  contactThisFrame: boolean;
  contactStringIndex?: number;
}

export class StringTensionGate {
  private readonly config: StringTensionGateConfig;
  private attachedToString = false;
  private attachedIndex = -1;
  private pullTension = 0;
  private releaseVelocity = 0;
  private pointerReleased = false;
  private triggerCooldown = 0;
  private previousTension = 0;
  private wasPointerActive = false;
  private slingshotArmed = false;

  constructor(config: Partial<StringTensionGateConfig> = {}) {
    this.config = { ...DEFAULT_STRING_TENSION_GATE_CONFIG, ...config };
  }

  getState(): ResonanceGateState {
    return {
      attachedToString: this.attachedToString,
      pullTension: this.pullTension,
      releaseVelocity: this.releaseVelocity,
      pointerReleased: this.pointerReleased,
      triggerCooldown: this.triggerCooldown,
    };
  }

  getPullTension(): number {
    return this.pullTension;
  }

  /** Alias for facial / deformation consumers. */
  getStringTension(): number {
    return this.pullTension;
  }

  getAttachedStringIndex(): number {
    return this.attachedIndex;
  }

  /**
   * Returns true once when a high-tension snap release armed the gate,
   * then clears the latch. Transition choreographer can poll this.
   */
  consumeSlingshotTrigger(): boolean {
    if (!this.slingshotArmed) return false;
    this.slingshotArmed = false;
    this.triggerCooldown = this.config.triggerCooldownSeconds;
    return true;
  }

  /** Peek without consuming — useful for debug overlays. */
  isSlingshotReady(): boolean {
    return this.slingshotArmed;
  }

  reset(): void {
    this.attachedToString = false;
    this.attachedIndex = -1;
    this.pullTension = 0;
    this.releaseVelocity = 0;
    this.pointerReleased = false;
    this.triggerCooldown = 0;
    this.previousTension = 0;
    this.wasPointerActive = false;
    this.slingshotArmed = false;
  }

  update(input: StringTensionUpdateInput): ResonanceGateState {
    const dt = Number.isFinite(input.dt) && input.dt > 0 ? input.dt : 0;
    if (this.triggerCooldown > 0 && dt > 0) {
      this.triggerCooldown = Math.max(0, this.triggerCooldown - dt);
    }

    this.pointerReleased = false;

    const string = this.resolveAttachedString(input);
    if (string && input.pointerActive) {
      this.attachedToString = true;
      this.attachedIndex = string.index;
      // Reason: pull distance is vertical separation from the rest line —
      // matches the guitar-string bend axis players already feel.
      const distance = input.pointerY - string.restY;
      const nextTension = computePullTension(
        distance,
        this.config.maxStringPull,
      );
      if (dt > 0) {
        this.releaseVelocity = (nextTension - this.previousTension) / dt;
      }
      this.previousTension = nextTension;
      this.pullTension = nextTension;
    } else if (
      !input.pointerActive &&
      this.wasPointerActive &&
      this.attachedToString
    ) {
      this.pointerReleased = true;
      // Reason: a held high-tension release still needs a snap signal even
      // when tension was momentarily flat — combine prior pull rate with
      // tension amplitude so choreography can poll a reliable arm.
      this.releaseVelocity = Math.max(
        Math.abs(this.releaseVelocity),
        this.pullTension * 2,
      );
      if (
        evaluateSlingshotReady(this.getState(), this.config) &&
        !this.slingshotArmed
      ) {
        this.slingshotArmed = true;
      }
      this.attachedToString = false;
      this.attachedIndex = -1;
      if (dt > 0) {
        this.pullTension = Math.max(
          0,
          this.pullTension - this.config.tensionDecayPerSecond * dt,
        );
      }
      this.previousTension = this.pullTension;
    } else {
      this.attachedToString = false;
      this.attachedIndex = -1;
      if (dt > 0) {
        this.pullTension = Math.max(
          0,
          this.pullTension - this.config.tensionDecayPerSecond * dt,
        );
      }
      this.releaseVelocity = 0;
      this.previousTension = this.pullTension;
    }

    this.wasPointerActive = input.pointerActive;
    return this.getState();
  }

  private resolveAttachedString(
    input: StringTensionUpdateInput,
  ): MusicalStringGeometry | null {
    const { strings } = input;
    if (strings.length === 0) return null;

    if (
      input.contactThisFrame &&
      input.contactStringIndex !== undefined &&
      Number.isFinite(input.contactStringIndex)
    ) {
      const hit = strings.find((s) => s.index === input.contactStringIndex);
      if (hit) return hit;
    }

    if (this.attachedIndex >= 0 && input.pointerActive) {
      const held = strings.find((s) => s.index === this.attachedIndex);
      if (
        held &&
        this.isNearString(
          input.pointerX,
          input.pointerY,
          input.rootX,
          input.rootY,
          held,
        )
      ) {
        return held;
      }
    }

    if (!input.pointerActive) return null;

    let best: MusicalStringGeometry | null = null;
    let bestDist = Infinity;
    for (const candidate of strings) {
      if (
        !this.isNearString(
          input.pointerX,
          input.pointerY,
          input.rootX,
          input.rootY,
          candidate,
        )
      ) {
        continue;
      }
      const dist = Math.abs(input.pointerY - candidate.restY);
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
    return best;
  }

  private isNearString(
    pointerX: number,
    pointerY: number,
    rootX: number,
    rootY: number,
    string: MusicalStringGeometry,
  ): boolean {
    const x = clamp((pointerX + rootX) * 0.5, string.left, string.right);
    const inSpan =
      x >= string.left - 8 &&
      x <= string.right + 8 &&
      pointerX >= string.left - 40 &&
      pointerX <= string.right + 40;
    if (!inSpan) return false;

    const pointerBand =
      Math.abs(pointerY - string.restY) <=
      this.config.attachBand * (1 + this.pullTension);
    const rootBand =
      Math.abs(rootY - string.restY) <= this.config.attachBand * 1.4;
    return pointerBand || rootBand;
  }
}
