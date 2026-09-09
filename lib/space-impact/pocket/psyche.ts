/**
 * Lost Signal: Pocket Edition — the Psyche engine.
 *
 * High-computation, perception-targeting cosmetic animation. Everything here
 * lives in the presentation layer only: it never touches the simulation's
 * random stream, entities, or collision. All effects respect the §6
 * visibility contract because they render into the history/scenery layer,
 * beneath the protected critical layer.
 *
 * Psychology behind each system:
 *  - ExcitableRot: excitable media (Greenberg–Hastings). Spiral waves read
 *    as organic decay — Gestalt emergence on a 4-tone screen.
 *  - EchoSwarm: boids flocking. A dozen moving dots trigger Johansson
 *    biological-motion perception: the brain sees creatures, not pixels.
 *  - BurnIn: exposure accumulation with slow decay. Real LCD/plasma burn-in
 *    makes a machine feel haunted by its use — "the screen remembers you".
 *  - Microsaccade: real fixation is never still; 1-px jerks every ~0.5 s
 *    keep the Watcher's eye biologically alive. Stillness reads as dead.
 *  - saccadicMask(): one blank frame on hard transitions mimics the brain's
 *    own saccadic masking, making cuts feel deliberate instead of glitchy.
 */
import type { Point } from "../types";

/** Deterministic 32-bit RNG (mulberry32). Presentation-local — never the sim stream. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Signal Rot — Greenberg–Hastings excitable media
// ---------------------------------------------------------------------------

export class ExcitableRot {
  readonly cols = 120;
  readonly rows = 66;
  readonly k = 6; // excited + refractory states
  state: Uint8Array;
  private next: Uint8Array;

  constructor() {
    this.state = new Uint8Array(this.cols * this.rows);
    this.next = new Uint8Array(this.cols * this.rows);
  }

  /** Ignite a few resting cells — call with a deterministic rng each wave. */
  ignite(rng: () => number, count = 3): void {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rng() * this.cols);
      const y = Math.floor(rng() * this.rows);
      this.state[y * this.cols + x] = 1;
    }
  }

  /** Ignite one specific cell (deterministic inline seeding). */
  igniteAt(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.state[y * this.cols + x] = 1;
  }

  step(): void {
    const { cols, rows, k, state, next } = this;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const s = state[i];
        if (s > 0) {
          next[i] = (s + 1) % k;
          continue;
        }
        // Resting cell fires if any excited neighbor exists.
        const left = x > 0 ? state[i - 1] : 0;
        const right = x < cols - 1 ? state[i + 1] : 0;
        const up = y > 0 ? state[i - cols] : 0;
        const down = y < rows - 1 ? state[i + cols] : 0;
        if (left === 1 || right === 1 || up === 1 || down === 1) next[i] = 1;
        else next[i] = 0;
      }
    }
    this.state.set(next);
  }

  /** 0 = quiet, 1 = freshly excited, 2-3 = refractory glow. */
  levelAt(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return 0;
    return this.state[y * this.cols + x];
  }
}

// ---------------------------------------------------------------------------
// Burn-in — the screen remembers your flight
// ---------------------------------------------------------------------------

export class BurnIn {
  readonly cols = 120;
  readonly rows = 66;
  heat: Float32Array;

  constructor() {
    this.heat = new Float32Array(this.cols * this.rows);
  }

  /** Accumulate exposure at an art-space position (0..240, 0..135). */
  splat(artX: number, artY: number, amount = 0.02): void {
    const cx = Math.floor(artX / 2);
    const cy = Math.floor(artY / 2);
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) continue;
        const falloff = 1 - (Math.abs(dx) + Math.abs(dy)) / 6;
        const i = y * this.cols + x;
        this.heat[i] = Math.min(1, this.heat[i] + amount * falloff);
      }
  }

  /** Exponential decay; ~30 s half-life at 60 Hz. */
  decay(): void {
    const k = Math.pow(0.5, 1 / (30 * 60));
    for (let i = 0; i < this.heat.length; i++)
      this.heat[i] = this.heat[i] > 0.004 ? this.heat[i] * k : 0;
  }

  /** Normalized 0..1 memory level at a cell. */
  levelAt(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return 0;
    return Math.min(1, this.heat[y * this.cols + x]);
  }
}

// ---------------------------------------------------------------------------
// Echo Swarm — boids in the sky band
// ---------------------------------------------------------------------------

export class EchoSwarm {
  readonly n = 16;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;

  constructor(seed = 0x5eed) {
    const rng = mulberry32(seed);
    this.x = new Float32Array(this.n);
    this.y = new Float32Array(this.n);
    this.vx = new Float32Array(this.n);
    this.vy = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) {
      this.x[i] = rng() * 240;
      this.y[i] = 6 + rng() * 30;
      const a = rng() * Math.PI * 2;
      this.vx[i] = Math.cos(a) * 8;
      this.vy[i] = Math.sin(a) * 4;
    }
  }

  /**
   * One flocking step in art-space. The swarm haunts the sky band (y 4..40),
   * flees the player, and chases a wandering lure — never a hazard read:
   * smooth paths + faded tone + persistence smear, under the critical layer.
   */
  step(player: Point, tick: number): void {
    const lureX = 120 + Math.sin(tick / 260) * 90;
    const lureY = 20 + Math.sin(tick / 170 + 2) * 12;
    const maxSpeed = 20;
    for (let i = 0; i < this.n; i++) {
      let ax = 0;
      let ay = 0;
      // Flocking: separation, alignment, cohesion.
      for (let j = 0; j < this.n; j++) {
        if (i === j) continue;
        const dx = this.x[i] - this.x[j];
        const dy = this.y[i] - this.y[j];
        const d2 = dx * dx + dy * dy;
        if (d2 > 324) continue; // 18 px perception radius
        const d = Math.sqrt(d2) || 0.001;
        if (d < 5) {
          ax += (dx / d) * 26; // separation
          ay += (dy / d) * 26;
        } else {
          ax += ((this.vx[j] - this.vx[i]) / d) * 0.5; // alignment
          ay += ((this.vy[j] - this.vy[i]) / d) * 0.5;
          ax += ((this.x[j] - this.x[i]) / d) * 0.6; // cohesion
          ay += ((this.y[j] - this.y[i]) / d) * 0.6;
        }
      }
      // Wander-lure pull.
      ax += (lureX - this.x[i]) * 0.004;
      ay += (lureY - this.y[i]) * 0.01;
      // Flee the player — the dead never touch the living.
      const pdx = this.x[i] - player.x / 2;
      const pdy = this.y[i] - player.y / 2;
      const pd = Math.hypot(pdx, pdy);
      if (pd < 24) {
        ax += (pdx / (pd || 1)) * 40;
        ay += (pdy / (pd || 1)) * 40;
      }
      this.vx[i] = (this.vx[i] + ax * 0.016) * 0.985;
      this.vy[i] = (this.vy[i] + ay * 0.016) * 0.985;
      const sp = Math.hypot(this.vx[i], this.vy[i]) || 0.001;
      if (sp > maxSpeed) {
        this.vx[i] = (this.vx[i] / sp) * maxSpeed;
        this.vy[i] = (this.vy[i] / sp) * maxSpeed;
      }
      this.x[i] += this.vx[i] * 0.016;
      this.y[i] += this.vy[i] * 0.016;
      // Soft bounds: sky band with horizontal wrap.
      if (this.x[i] < -4) this.x[i] = 244;
      if (this.x[i] > 244) this.x[i] = -4;
      if (this.y[i] < 4) {
        this.y[i] = 4;
        this.vy[i] = Math.abs(this.vy[i]);
      }
      if (this.y[i] > 40) {
        this.y[i] = 40;
        this.vy[i] = -Math.abs(this.vy[i]);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Microsaccade + blink — the living eye
// ---------------------------------------------------------------------------

export class Microsaccade {
  offsetX = 0;
  offsetY = 0;
  private until = 0;

  /** Schedule 1-px jerks with biological spacing. tick = sim ticks. */
  step(tick: number): void {
    const t = tick / 60;
    if (t < this.until) return;
    const rng = mulberry32(tick * 2654435761);
    const hold = 0.3 + rng() * 0.9;
    this.until = t + hold;
    // Most fixations nudge ±1 px; occasionally a double-step to ±2.
    const mag = rng() < 0.82 ? 1 : 2;
    this.offsetX = Math.round((rng() * 2 - 1) * mag);
    this.offsetY = Math.round((rng() * 2 - 1) * mag * 0.5);
    if (rng() < 0.25) this.offsetX = 0;
  }
}

/**
 * Blink phase: returns true while the eye is shut. Blinks last 3 ticks and
 * arrive every 7–13 s, like a real reflexive blink cycle.
 */
export function eyeBlink(tick: number): boolean {
  const cycle = 7 * 60 + ((tick * 7919) % (6 * 60));
  return tick % cycle < 3;
}

// ---------------------------------------------------------------------------
// Saccadic masking — blank frame on hard cuts
// ---------------------------------------------------------------------------

/**
 * Returns true while a transition mask should hide the field. The brain
 * suppresses vision during saccades; one or two blank (backlight-only)
 * frames on a scene cut make the transition feel willed, not glitched.
 */
export function saccadicMask(framesSinceTransition: number): boolean {
  return framesSinceTransition >= 0 && framesSinceTransition < 2;
}
