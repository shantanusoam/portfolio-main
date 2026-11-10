/** Bounded, deterministic flocking in a 1000 × 500 meadow. Units are per second. */
export type Seed = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
};
export type FlockMode = "gather" | "release";
export function createFlock(count = 30): Seed[] {
  return Array.from({ length: Math.min(40, Math.max(1, count)) }, (_, i) => {
    const angle = i * 2.399963229728653;
    const radius = 35 + Math.sqrt(i) * 27;
    return {
      x: 500 + Math.cos(angle) * radius,
      y: 250 + Math.sin(angle) * radius * 0.55,
      vx: Math.cos(angle) * 18,
      vy: Math.sin(angle) * 12,
      phase: i * 0.73,
    };
  });
}
const limit = (x: number, y: number, max: number) => {
  const length = Math.hypot(x, y);
  return length > max ? [(x / length) * max, (y / length) * max] : [x, y];
};
export function stepFlock(
  seeds: Seed[],
  seconds: number,
  target: { x: number; y: number },
  mode: FlockMode,
  time: number,
) {
  const dt = Math.max(
    0,
    Math.min(Number.isFinite(seconds) ? seconds : 0, 1 / 30),
  );
  if (!dt) return;
  const safeTarget = {
    x: Math.max(90, Math.min(910, Number.isFinite(target.x) ? target.x : 500)),
    y: Math.max(80, Math.min(420, Number.isFinite(target.y) ? target.y : 250)),
  };
  const forces = seeds.map((seed, index) => {
    let sx = 0,
      sy = 0,
      ax = 0,
      ay = 0,
      cx = 0,
      cy = 0,
      near = 0;
    for (let j = 0; j < seeds.length; j++) {
      if (index === j) continue;
      const other = seeds[j],
        dx = seed.x - other.x,
        dy = seed.y - other.y,
        d = Math.hypot(dx, dy);
      if (d < 135) {
        near++;
        ax += other.vx;
        ay += other.vy;
        cx += other.x;
        cy += other.y;
      }
      if (d < 43) {
        const safe = Math.max(d, 1);
        sx += (dx / safe) * (43 - d) * 2;
        sy += (dy / safe) * (43 - d) * 2;
      }
    }
    const angle = time * 0.16 + index * 2.399963;
    const radius = mode === "gather" ? 72 : 155 + (index % 5) * 16;
    const tx = safeTarget.x + Math.cos(angle) * radius,
      ty = safeTarget.y + Math.sin(angle) * radius * 0.58;
    let fx = (tx - seed.x) * 0.28 + sx,
      fy = (ty - seed.y) * 0.28 + sy;
    if (near) {
      fx += (ax / near - seed.vx) * 0.48 + (cx / near - seed.x) * 0.045;
      fy += (ay / near - seed.vy) * 0.48 + (cy / near - seed.y) * 0.045;
    }
    // The field bends them inward before they reach an edge; no sudden wrapping.
    if (seed.x < 70) fx += (70 - seed.x) * 1.8;
    if (seed.x > 930) fx -= (seed.x - 930) * 1.8;
    if (seed.y < 65) fy += (65 - seed.y) * 1.8;
    if (seed.y > 435) fy -= (seed.y - 435) * 1.8;
    return limit(fx, fy, 110);
  });
  seeds.forEach((seed, i) => {
    const [vx, vy] = limit(
      seed.vx + forces[i][0] * dt,
      seed.vy + forces[i][1] * dt,
      mode === "gather" ? 56 : 72,
    );
    seed.vx = vx;
    seed.vy = vy;
    seed.x = Math.max(30, Math.min(970, seed.x + vx * dt));
    seed.y = Math.max(30, Math.min(470, seed.y + vy * dt));
  });
}
