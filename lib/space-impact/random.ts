import type { Game } from "./types";

/** Gameplay uses a per-run xorshift stream. Rendering never consumes it. */
export function random(game: Pick<Game, "random">): number {
  let value = game.random | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  game.random = value >>> 0;
  return game.random / 4294967296;
}
export function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0 || 1;
}
/** Pure visual noise: independent of gameplay RNG and render frequency. */
export function noise(index: number): number {
  const n = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}
