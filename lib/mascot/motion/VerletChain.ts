import { EPSILON } from "../core/NumericGuards";
import type { VerletNode } from "../types";

/**
 * Verlet secondary motion for tail tips, antennae, and loose sensory fins —
 * genuine physical memory that the forward spine chain doesn't have.
 * Root node is pinned to the rig each frame by the caller via
 * `pinVerletNode`; the rest integrate freely and settle via distance
 * constraints.
 */

export interface VerletChainConfig {
  segmentLength: number;
  /** 0..1, fraction of velocity retained per step. */
  drag: number;
  iterations: number;
  /** Caps per-step displacement so a large dt can't inject unbounded energy. */
  maxSpeed: number;
}

const MAX_ITERATIONS = 8;

export function createVerletNodes(
  count: number,
  originX: number,
  originY: number,
): VerletNode[] {
  return Array.from({ length: count }, (_, i) => ({
    x: originX,
    y: originY + i * 0.01,
    previousX: originX,
    previousY: originY + i * 0.01,
    pinned: i === 0,
  }));
}

export function resetVerletNodes(
  nodes: VerletNode[],
  originX: number,
  originY: number,
): void {
  for (const node of nodes) {
    node.x = originX;
    node.y = originY;
    node.previousX = originX;
    node.previousY = originY;
  }
}

export function pinVerletNode(node: VerletNode, x: number, y: number): void {
  node.x = x;
  node.y = y;
  node.previousX = x;
  node.previousY = y;
  node.pinned = true;
}

export function integrateVerlet(
  nodes: readonly VerletNode[],
  dt: number,
  config: VerletChainConfig,
  accelerationX = 0,
  accelerationY = 0,
): void {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const dtSq = dt * dt;
  const maxStep = config.maxSpeed * dt;

  for (const node of nodes) {
    if (node.pinned) continue;

    let vx = (node.x - node.previousX) * config.drag;
    let vy = (node.y - node.previousY) * config.drag;

    const speed = Math.hypot(vx, vy);
    if (speed > maxStep && speed > EPSILON) {
      const scale = maxStep / speed;
      vx *= scale;
      vy *= scale;
    }

    const nextX = node.x + vx + accelerationX * dtSq;
    const nextY = node.y + vy + accelerationY * dtSq;

    node.previousX = node.x;
    node.previousY = node.y;

    if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
      node.x = nextX;
      node.y = nextY;
    }
  }
}

export function solveVerletDistanceConstraints(
  nodes: readonly VerletNode[],
  segmentLength: number,
  iterations: number,
): void {
  const boundedIterations = Math.max(1, Math.min(MAX_ITERATIONS, iterations));

  for (let iter = 0; iter < boundedIterations; iter += 1) {
    for (let i = 0; i < nodes.length - 1; i += 1) {
      const a = nodes[i];
      const b = nodes[i + 1];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(EPSILON, Math.hypot(dx, dy));
      const diff = (dist - segmentLength) / dist;

      const aMovable = !a.pinned;
      const bMovable = !b.pinned;
      if (!aMovable && !bMovable) continue;

      let aShare = 0.5;
      let bShare = 0.5;
      if (!aMovable) {
        aShare = 0;
        bShare = 1;
      } else if (!bMovable) {
        aShare = 1;
        bShare = 0;
      }

      const offsetX = dx * diff;
      const offsetY = dy * diff;

      if (aMovable) {
        a.x += offsetX * aShare;
        a.y += offsetY * aShare;
      }
      if (bMovable) {
        b.x -= offsetX * bShare;
        b.y -= offsetY * bShare;
      }
    }
  }
}
