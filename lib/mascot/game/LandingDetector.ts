import { clamp } from "../core/NumericGuards";
import type { GeneratedPlatform } from "./GameTypes";

/**
 * Swept vertical landing collision — spec's "LANDING DETECTION" section:
 * player was above the platform top last step, crosses it this step, is
 * moving downward, overlaps horizontally, the platform is active, and
 * isn't on cooldown. Pure function (no state) except for the caller-owned
 * cooldown map, so it's directly unit-testable and never resolves an
 * upward collision as a landing.
 */

export interface LandingResult {
  platformId: string;
  x: number;
  y: number;
  contactPosition: number;
}

export type LandingCooldowns = Record<string, number>;

export function detectLanding(
  previousY: number,
  currentY: number,
  velocityY: number,
  playerX: number,
  playerRadius: number,
  platforms: readonly GeneratedPlatform[],
  now: number,
  cooldowns: LandingCooldowns,
): LandingResult | null {
  if (velocityY <= 0) return null;

  let best: GeneratedPlatform | null = null;
  for (const platform of platforms) {
    if (!platform.active) continue;
    if (now < (cooldowns[platform.id] ?? -Infinity)) continue;
    if (previousY > platform.y) continue;
    if (currentY < platform.y) continue;

    const left = platform.x - playerRadius;
    const right = platform.x + platform.width + playerRadius;
    if (playerX < left || playerX > right) continue;

    if (!best || platform.y < best.y) best = platform;
  }

  if (!best) return null;

  const contactPosition = clamp(
    (playerX - best.x) / Math.max(1, best.width),
    0,
    1,
  );
  return { platformId: best.id, x: playerX, y: best.y, contactPosition };
}
