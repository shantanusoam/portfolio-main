/**
 * Deterministic PRNG (mulberry32) used everywhere the mascot needs
 * randomness — wander paths, skin sampling, particle seeding, scatter
 * directions. Never call Math.random() in lib/mascot: it breaks replay
 * determinism (see MascotDebugSnapshot / ReplayRecorder).
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = SeededRandom.hashSeed(seed);
  }

  private static hashSeed(seed: number): number {
    let h = seed | 0;
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    // Never let the internal state settle on zero — mulberry32 would then
    // return zero forever.
    return h >>> 0 || 1;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("SeededRandom.pick: items must not be empty");
    }
    return items[Math.floor(this.next() * items.length) % items.length];
  }

  /** Returns a uniformly-distributed angle in radians, [0, 2*PI). */
  angle(): number {
    return this.next() * Math.PI * 2;
  }

  sign(): 1 | -1 {
    return this.next() < 0.5 ? -1 : 1;
  }

  /** Derives a new independent, still-deterministic generator. */
  fork(): SeededRandom {
    return new SeededRandom(Math.floor(this.next() * 0xffffffff));
  }
}
