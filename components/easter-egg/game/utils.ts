let entitySeed = 0;

export function nextId(): number {
  entitySeed += 1;
  return entitySeed;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function distanceSquared(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function angleTo(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

export function findNearestEnemy<T extends { dead?: boolean; x: number; y: number }>(
  enemies: T[],
  x: number,
  y: number,
): T | undefined {
  let best: T | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  enemies.forEach((enemy) => {
    if (enemy.dead) return;
    const dist = distanceSquared(x, y, enemy.x, enemy.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = enemy;
    }
  });
  return best;
}
