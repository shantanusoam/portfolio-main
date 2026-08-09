import { clamp } from "../core/NumericGuards";
import { SeededRandom } from "../core/SeededRandom";
import { resolvePortfolioModeNote } from "../music/HarmonyMap";
import {
  computeHorizontalReach,
  computeMaxJumpHeight,
  computeTimeToHeight,
} from "./AscentPhysics";
import { STRUMRISE_CONFIG } from "./StrumriseConfig";
import type { GeneratedPlatform, StringPlatformKind } from "./GameTypes";

/**
 * Deterministic seeded platform generation — spec's "LEVEL GENERATION":
 * reachability is computed from the *previous* platform's bounce (what
 * actually launches the player toward the next one), never placed through
 * unrestricted random coordinates. See docs/mascot/STRUMRISE_DESIGN.md for
 * the reachability-test property verified in
 * tests/mascot/game/PlatformGenerator.test.ts.
 */

export interface PlatformGeneratorOptions {
  seed: number;
  startY: number;
  viewportWidth: number;
}

function frequencyToMidi(frequency: number): number {
  if (!Number.isFinite(frequency) || frequency <= 0) return 0;
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

export class PlatformGenerator {
  private rng: SeededRandom;
  private readonly startY: number;
  private readonly viewportWidth: number;
  private lastX: number;
  private lastY: number;
  private lastKind: StringPlatformKind = "normal";
  private degreeIndex = 0;
  private consecutiveTreble = 0;
  private generatedCount = 0;

  constructor(options: PlatformGeneratorOptions) {
    this.rng = new SeededRandom(options.seed);
    this.startY = options.startY;
    this.viewportWidth = options.viewportWidth;
    this.lastX = options.viewportWidth / 2;
    this.lastY = options.startY;
  }

  /** The single safe, generous starting platform the player spawns on. */
  generateGroundPlatform(id: string): GeneratedPlatform {
    const width = STRUMRISE_CONFIG.generation.widths.normal * 1.4;
    const x = clamp(
      this.lastX - width / 2,
      0,
      Math.max(0, this.viewportWidth - width),
    );
    const platform = this.buildPlatform(id, "normal", x, this.lastY, width);
    // Keeps `generateNext`'s reach math anchored to the ground platform's
    // actual (clamped) position — without this, the first reach check would
    // be computed relative to the constructor's unclamped center estimate.
    this.lastX = x;
    this.lastKind = "normal";
    return platform;
  }

  generateNext(id: string): GeneratedPlatform {
    const cfg = STRUMRISE_CONFIG.generation;
    const physicsCfg = STRUMRISE_CONFIG.physics;
    const generous = this.generatedCount < cfg.firstGenerousCount;
    const kind = generous ? "normal" : this.pickKind();
    const width = cfg.widths[kind];

    const bounceSpeed = physicsCfg.bounce[this.lastKind];
    const maxHeight = computeMaxJumpHeight(bounceSpeed, physicsCfg.gravity);
    const gapY = clamp(
      maxHeight * this.rng.range(0.35, cfg.maxGapYFactor),
      cfg.minGapY,
      maxHeight * cfg.maxGapYFactor,
    );

    const time = computeTimeToHeight(bounceSpeed, physicsCfg.gravity, gapY);
    const reach =
      (time === null
        ? 0
        : computeHorizontalReach(
            physicsCfg.maxHorizontalSpeed,
            physicsCfg.horizontalAcceleration,
            time,
          )) * cfg.reachSafetyFactor;

    const dx = this.rng.range(-reach, reach);
    const x = clamp(
      this.lastX + dx,
      0,
      Math.max(0, this.viewportWidth - width),
    );
    const y = this.lastY - gapY;

    const platform = this.buildPlatform(id, kind, x, y, width);

    this.lastX = x;
    this.lastY = y;
    this.lastKind = kind;
    this.generatedCount += 1;
    this.consecutiveTreble = kind === "treble" ? this.consecutiveTreble + 1 : 0;

    return platform;
  }

  private pickKind(): StringPlatformKind {
    const cfg = STRUMRISE_CONFIG.generation;
    if (this.consecutiveTreble >= cfg.maxConsecutiveTreble) return "normal";
    const roll = this.rng.next();
    if (roll < cfg.typeWeights.bass) return "bass";
    if (roll < cfg.typeWeights.bass + cfg.typeWeights.treble) return "treble";
    return "normal";
  }

  private buildPlatform(
    id: string,
    kind: StringPlatformKind,
    x: number,
    y: number,
    width: number,
  ): GeneratedPlatform {
    const stepDegree =
      this.rng.next() < 0.15 ? 0 : this.rng.pick([-2, -1, 1, 2]);
    this.degreeIndex += stepDegree;
    const octaveOffset = kind === "bass" ? -1 : kind === "treble" ? 1 : 0;
    const noteIdentity = resolvePortfolioModeNote(
      STRUMRISE_CONFIG.generation.harmonyRootMidi,
      this.degreeIndex,
      octaveOffset,
    );

    return {
      id,
      kind,
      x,
      y,
      width,
      note: {
        midiNote: frequencyToMidi(noteIdentity.frequency),
        frequency: noteIdentity.frequency,
      },
      chordRole: ((this.degreeIndex % 5) + 5) % 5,
      difficulty: clamp(
        (this.startY - y) / STRUMRISE_CONFIG.sector.heightTarget,
        0,
        1,
      ),
      seed: this.rng.next(),
      active: true,
    };
  }
}
