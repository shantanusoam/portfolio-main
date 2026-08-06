/**
 * Fixed-capacity particle pool: acceleration sparks, click scatter, reform
 * trails, impact ripple, inspect glints, sleep pulse. Slots are
 * preallocated once and recycled — never grows, never allocates per spawn.
 */

export type ParticleCategory =
  | "spark"
  | "clickScatter"
  | "reformTrail"
  | "impactRipple"
  | "inspectGlint"
  | "sleepPulse"
  | "textParticle";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 1 = just spawned, 0 = dead. */
  life: number;
  maxLife: number;
  radius: number;
  category: ParticleCategory;
  active: boolean;
  seed: number;
}

export class ParticlePool {
  private readonly particles: Particle[];
  private readonly capacity: number;
  private cursor = 0;

  constructor(capacity: number) {
    this.capacity = Math.max(0, capacity);
    this.particles = Array.from({ length: this.capacity }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      radius: 1,
      category: "spark" as ParticleCategory,
      active: false,
      seed: 0,
    }));
  }

  getCapacity(): number {
    return this.capacity;
  }

  /** Spawns into the first inactive slot, or recycles the oldest slot (ring cursor) once full. Returns null at zero capacity. */
  spawn(
    category: ParticleCategory,
    x: number,
    y: number,
    vx: number,
    vy: number,
    maxLife: number,
    radius: number,
    seed: number,
  ): Particle | null {
    if (this.capacity === 0) return null;

    let index = -1;
    for (let i = 0; i < this.particles.length; i += 1) {
      if (!this.particles[i].active) {
        index = i;
        break;
      }
    }
    if (index === -1) {
      index = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;
    }

    const particle = this.particles[index];
    particle.x = x;
    particle.y = y;
    particle.vx = vx;
    particle.vy = vy;
    particle.life = 1;
    particle.maxLife = Math.max(0.0001, maxLife);
    particle.radius = Math.max(0, radius);
    particle.category = category;
    particle.active = true;
    particle.seed = seed;
    return particle;
  }

  update(dt: number, drag = 0.98): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    for (const particle of this.particles) {
      if (!particle.active) continue;

      particle.life -= dt / particle.maxLife;
      if (particle.life <= 0) {
        particle.active = false;
        continue;
      }

      particle.vx *= drag;
      particle.vy *= drag;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      if (!Number.isFinite(particle.x) || !Number.isFinite(particle.y)) {
        particle.active = false;
      }
    }
  }

  clear(): void {
    for (const particle of this.particles) {
      particle.active = false;
    }
  }

  forEachActive(callback: (particle: Particle) => void): void {
    for (const particle of this.particles) {
      if (particle.active) callback(particle);
    }
  }

  getActiveCount(): number {
    let count = 0;
    for (const particle of this.particles) {
      if (particle.active) count += 1;
    }
    return count;
  }
}
