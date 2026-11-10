/** A small deterministic climbing garden. World Y points upward; player Y is its feet. */
export const GARDEN_WIDTH = 480;
export const GARDEN_HEIGHT = 480;
export const PLAYER_RADIUS = 13;
export const GRAVITY = 1120;
export const HOP_SPEED = 490;
export type Leaf = {
  id: number;
  x: number;
  y: number;
  width: number;
  bend: number;
  seed: boolean;
};
export type CanopyState = {
  player: { x: number; y: number; previousY: number; vx: number; vy: number };
  leaves: Leaf[];
  highestLeaf: number;
  collected: number;
  camera: number;
  time: number;
  recovery: number;
  landed: number;
  won: boolean;
};
function randomSource(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
export function createGarden(seed = 7401): CanopyState {
  const random = randomSource(seed);
  const leaves: Leaf[] = [
    { id: 0, x: 240, y: 38, width: 212, bend: 0, seed: false },
  ];
  for (let i = 1; i <= 12; i++) {
    const previous = leaves[i - 1];
    const drift = (i % 2 ? -1 : 1) * (52 + random() * 38);
    leaves.push({
      id: i,
      x: Math.max(75, Math.min(405, previous.x + drift)),
      y: previous.y + 72 + random() * 8,
      width: 108 + random() * 20,
      bend: 0,
      seed: true,
    });
  }
  return {
    player: { x: 240, y: 38, previousY: 38, vx: 0, vy: HOP_SPEED },
    leaves,
    highestLeaf: 0,
    collected: 0,
    camera: 0,
    time: 0,
    recovery: 0,
    landed: -1,
    won: false,
  };
}
/** Swept feet collision prevents tunnelling through a leaf on a slow frame. */
export function crossesLeaf(
  previousY: number,
  y: number,
  x: number,
  leaf: Leaf,
): boolean {
  return (
    previousY >= leaf.y &&
    y <= leaf.y &&
    Math.abs(x - leaf.x) <= leaf.width / 2 + PLAYER_RADIUS * 0.65
  );
}
/** Fixed-step caller preferred; each public step is bounded after tab suspension. */
export function stepGarden(
  state: CanopyState,
  horizontal: number,
  elapsed: number,
): void {
  if (state.won || !Number.isFinite(elapsed) || elapsed <= 0) return;
  const dt = Math.min(elapsed, 1 / 30);
  state.time += dt;
  state.landed = -1;
  state.recovery = Math.max(0, state.recovery - dt);
  state.leaves.forEach((leaf) => {
    leaf.bend *= Math.exp(-dt * 7);
  });
  const p = state.player;
  const input = Number.isFinite(horizontal)
    ? Math.max(-1, Math.min(1, horizontal))
    : 0;
  p.vx += (input * 210 - p.vx) * (1 - Math.exp(-dt * 11));
  p.x = Math.max(
    PLAYER_RADIUS + 4,
    Math.min(GARDEN_WIDTH - PLAYER_RADIUS - 4, p.x + p.vx * dt),
  );
  p.previousY = p.y;
  p.vy -= GRAVITY * dt;
  p.y += p.vy * dt;
  if (p.vy <= 0) {
    const landed = [...state.leaves]
      .reverse()
      .find((leaf) => crossesLeaf(p.previousY, p.y, p.x, leaf));
    if (landed) {
      p.y = landed.y;
      p.vy = HOP_SPEED;
      landed.bend = 1;
      state.landed = landed.id;
      state.highestLeaf = Math.max(state.highestLeaf, landed.id);
      if (landed.seed) {
        landed.seed = false;
        state.collected++;
      }
      if (landed.id === state.leaves.length - 1) {
        state.won = true;
        p.vy = 0;
      }
    }
  }
  const targetCamera = Math.max(0, p.y - GARDEN_HEIGHT * 0.47);
  state.camera +=
    (Math.max(state.camera, targetCamera) - state.camera) *
    (1 - Math.exp(-dt * 6));
  if (p.y < state.camera - 80) returnToLeaf(state);
}
/** A missed landing returns you to the highest leaf; progress is never erased. */
export function returnToLeaf(state: CanopyState): void {
  const leaf = state.leaves[state.highestLeaf];
  state.player = {
    x: leaf.x,
    y: leaf.y,
    previousY: leaf.y,
    vx: 0,
    vy: HOP_SPEED,
  };
  state.camera = Math.max(0, leaf.y - 170);
  state.recovery = 1.2;
}
/** A non-animated equivalent for visitors who prefer a still experience. */
export function takeQuietStep(state: CanopyState): void {
  if (state.won) return;
  const next =
    state.leaves[Math.min(state.leaves.length - 1, state.highestLeaf + 1)];
  state.highestLeaf = next.id;
  if (next.seed) {
    next.seed = false;
    state.collected++;
  }
  state.player = { x: next.x, y: next.y, previousY: next.y, vx: 0, vy: 0 };
  state.camera = Math.max(0, next.y - 170);
  state.won = next.id === state.leaves.length - 1;
}
