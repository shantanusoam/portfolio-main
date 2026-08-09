import { clamp } from "../core/NumericGuards";
import type { StringPluckEvent } from "../types";
import type { MusicalStringGeometry } from "./StringRegistry";

/**
 * Swept string-crossing detection: a contact point's Y straddling a
 * string's rest line between two consecutive samples, moving fast enough,
 * inside the string's horizontal span, and past its per-(point, string)
 * cooldown — never "any frame the point overlaps the line." Velocity is
 * derived internally from consecutive samples, so callers only ever pass
 * a position.
 */

export type ContactPointType = "core" | "tail" | "fin";

export interface ContactPoint {
  id: string;
  type: ContactPointType;
  x: number;
  y: number;
}

export interface StringContactDetectorConfig {
  cooldownSeconds: number;
  /** Minimum vertical speed (px/s) for a crossing to count — filters out slow resting overlap. */
  minSpeed: number;
}

const VELOCITY_REFERENCE = 900; // px/s, roughly a brisk sprint crossing — maps to intensity 1.

export class StringContactDetector {
  private readonly previousY = new Map<string, number>();
  private readonly lastContactAt = new Map<string, number>();

  detect(
    now: number,
    dt: number,
    strings: readonly MusicalStringGeometry[],
    contactPoints: readonly ContactPoint[],
    config: StringContactDetectorConfig,
  ): StringPluckEvent[] {
    if (!Number.isFinite(dt) || dt <= 0 || strings.length === 0) {
      for (const point of contactPoints) this.previousY.set(point.id, point.y);
      return [];
    }

    const events: StringPluckEvent[] = [];

    for (const point of contactPoints) {
      const previousY = this.previousY.get(point.id);
      this.previousY.set(point.id, point.y);
      if (previousY === undefined) continue;

      const velocityY = (point.y - previousY) / dt;
      if (Math.abs(velocityY) < config.minSpeed) continue;

      for (const string of strings) {
        if (point.x < string.left || point.x > string.right) continue;

        const crossed =
          (previousY - string.restY) * (point.y - string.restY) < 0;
        if (!crossed) continue;

        const cooldownKey = `${point.id}:${string.id}`;
        const lastContact = this.lastContactAt.get(cooldownKey) ?? -Infinity;
        if (now - lastContact < config.cooldownSeconds) continue;
        this.lastContactAt.set(cooldownKey, now);

        const intensity = clamp(
          Math.pow(Math.abs(velocityY) / VELOCITY_REFERENCE, 0.6),
          0,
          1,
        );
        const normalizedX = clamp(
          (point.x - string.left) / Math.max(1, string.right - string.left),
          0,
          1,
        );

        events.push({
          stringId: string.id,
          stringIndex: string.index,
          contactType: point.type,
          contactPosition: normalizedX,
          velocity: intensity,
          direction: velocityY > 0 ? 1 : -1,
          worldX: point.x,
          worldY: point.y,
          gameMode: false,
          combo: 0,
          timestamp: now,
        });
      }
    }

    return events;
  }

  reset(): void {
    this.previousY.clear();
    this.lastContactAt.clear();
  }
}
