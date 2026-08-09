import { FixedStepLoop } from "../core/FixedStepLoop";
import { clamp, lerp } from "../core/NumericGuards";
import { SeededRandom } from "../core/SeededRandom";
import type { BodyDeformation, MusicalEvent } from "../types";
import { AscentGameController } from "./AscentGameState";
import {
  applyBounce,
  createInitialPlayerState,
  integratePlayer,
} from "./AscentPhysics";
import { AscentCamera } from "./AscentCamera";
import { detectLanding, type LandingCooldowns } from "./LandingDetector";
import { PlatformGenerator } from "./PlatformGenerator";
import { ScoreDirector } from "./ScoreDirector";
import { loadStrumriseSave, saveStrumriseSave } from "./StrumrisePersistence";
import { STRUMRISE_CONFIG } from "./StrumriseConfig";
import type {
  AscentGameState,
  AscentPlayerState,
  GeneratedPlatform,
  LandingFeedbackEvent,
} from "./GameTypes";

/**
 * Pure simulation orchestrator for Strumrise — owns its own `FixedStepLoop`
 * exactly like `MascotEngine` owns one for the homepage mascot, but is a
 * fully separate, dedicated class (spec: "Game mode must not reuse
 * homepage behavior conditions in an uncontrolled way"). Zero React, zero
 * DOM drawing — see components/strumrise/StrumriseOverlay.tsx for the
 * Canvas/HUD layer that reads `getSnapshot()` and drains the bounded event
 * arrays each frame.
 */

export interface StrumriseRuntimeOptions {
  seed: number;
  viewportWidth: number;
  viewportHeight: number;
  reducedMotion?: boolean;
  onRender?: (alpha: number) => void;
}

export interface StrumriseSnapshot {
  state: AscentGameState;
  player: AscentPlayerState;
  platforms: readonly GeneratedPlatform[];
  cameraY: number;
  score: number;
  combo: number;
  heightClimbed: number;
  bestHeight: number;
  bestScore: number;
  lives: number;
  deformation: BodyDeformation;
  viewportWidth: number;
  viewportHeight: number;
  muted: boolean;
}

function neutralDeformation(): BodyDeformation {
  return {
    longitudinalScale: 1,
    lateralScale: 1,
    headSquash: 0,
    tailStretch: 0,
    finSpread: 0,
    impactWave: 0,
    tumbleRotation: 0,
  };
}

export class StrumriseRuntime {
  readonly controller = new AscentGameController();
  private readonly loop: FixedStepLoop;
  private readonly camera: AscentCamera;
  private readonly score = new ScoreDirector();

  private rng: SeededRandom;
  private generator: PlatformGenerator;
  private platforms: GeneratedPlatform[] = [];
  private readonly platformCooldowns: LandingCooldowns = {};
  private player: AscentPlayerState;
  private simTime = 0;
  private lastLandingAt = -Infinity;
  private heightClimbed = 0;
  private fallingOutTimer = 0;
  private nextPlatformId = 0;
  private deformation: BodyDeformation = neutralDeformation();
  private save = loadStrumriseSave();

  private readonly viewportWidth: number;
  private viewportHeight: number;
  private readonly reducedMotion: boolean;

  /** Events emitted this frame — bounded, cleared and replaced each `update()`, drained by the React layer. */
  musicalEvents: MusicalEvent[] = [];
  landingEvents: LandingFeedbackEvent[] = [];

  constructor(options: StrumriseRuntimeOptions) {
    this.viewportWidth = options.viewportWidth;
    this.viewportHeight = options.viewportHeight;
    this.reducedMotion = options.reducedMotion ?? false;
    this.rng = new SeededRandom(options.seed);
    this.generator = new PlatformGenerator({
      seed: options.seed,
      startY: 0,
      viewportWidth: this.viewportWidth,
    });
    this.player = createInitialPlayerState(this.viewportWidth / 2, -40);
    this.camera = new AscentCamera(
      this.player.y -
        this.viewportHeight +
        STRUMRISE_CONFIG.camera.startBottomMargin,
    );
    this.seedInitialPlatforms();

    this.loop = new FixedStepLoop({
      update: (dt) => this.update(dt),
      render: (alpha) => options.onRender?.(alpha),
    });
  }

  private seedInitialPlatforms(): void {
    const ground = this.generator.generateGroundPlatform(this.nextId());
    this.platforms = [ground];
    this.player.groundedStringId = ground.id;
    for (let i = 0; i < STRUMRISE_CONFIG.generation.windowAhead; i += 1) {
      this.platforms.push(this.generator.generateNext(this.nextId()));
    }
  }

  private nextId(): string {
    this.nextPlatformId += 1;
    return `platform-${this.nextPlatformId}`;
  }

  begin(): void {
    if (this.controller.getState() === "inactive") {
      this.controller.transition("transitioningIn");
    }
    this.controller.transition("ready");
  }

  start(): void {
    if (!this.controller.transition("playing")) return;
    this.loop.start();
  }

  pause(): void {
    if (!this.controller.transition("paused")) return;
    this.loop.stop();
  }

  resume(): void {
    if (!this.controller.transition("playing")) return;
    this.loop.start();
  }

  retry(): void {
    this.loop.stop();
    const newSeed = Math.floor(this.rng.next() * 0xffffffff);
    this.rng = new SeededRandom(newSeed);
    this.generator = new PlatformGenerator({
      seed: newSeed,
      startY: 0,
      viewportWidth: this.viewportWidth,
    });
    this.player = createInitialPlayerState(this.viewportWidth / 2, -40);
    this.camera.reset(
      this.player.y -
        this.viewportHeight +
        STRUMRISE_CONFIG.camera.startBottomMargin,
    );
    this.score.reset();
    this.deformation = neutralDeformation();
    this.heightClimbed = 0;
    this.simTime = 0;
    this.lastLandingAt = -Infinity;
    this.nextPlatformId = 0;
    for (const key of Object.keys(this.platformCooldowns)) {
      delete this.platformCooldowns[key];
    }
    this.seedInitialPlatforms();

    this.controller.reset();
    this.controller.transition("transitioningIn");
    this.controller.transition("ready");
    this.controller.transition("playing");
    this.loop.start();
  }

  setInput(x: number): void {
    this.player.inputX = clamp(x, -1, 1);
  }

  resize(_width: number, height: number): void {
    this.viewportHeight = height;
  }

  exit(): void {
    this.loop.stop();
    this.save = saveStrumriseSave({
      bestScore: Math.max(this.save.bestScore, this.score.getScore()),
      bestHeight: Math.max(this.save.bestHeight, this.heightClimbed),
    });
    this.controller.transition("transitioningOut");
  }

  setMuted(muted: boolean): void {
    this.save = saveStrumriseSave({ muted });
  }

  destroy(): void {
    this.loop.stop();
  }

  getSnapshot(): StrumriseSnapshot {
    return {
      state: this.controller.getState(),
      player: this.player,
      platforms: this.platforms,
      cameraY: this.camera.getY(),
      score: this.score.getScore(),
      combo: this.score.getCombo(),
      heightClimbed: this.heightClimbed,
      bestHeight: Math.max(this.save.bestHeight, this.heightClimbed),
      bestScore: Math.max(this.save.bestScore, this.score.getScore()),
      lives: this.player.lives,
      deformation: this.deformation,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      muted: this.save.muted,
    };
  }

  private update(dt: number): void {
    this.simTime += dt;
    this.musicalEvents = [];
    this.landingEvents = [];

    const state = this.controller.getState();
    if (state === "playing") {
      this.updatePlaying(dt);
    } else if (state === "fallingOut") {
      this.updateFallingOut(dt);
    }
  }

  private updatePlaying(dt: number): void {
    this.player = integratePlayer(this.player, dt);
    this.score.tick(dt);

    const landing = detectLanding(
      this.player.previousY,
      this.player.y,
      this.player.velocityY,
      this.player.x,
      STRUMRISE_CONFIG.physics.playerRadius,
      this.platforms,
      this.simTime,
      this.platformCooldowns,
    );

    if (landing) {
      this.resolveLanding(landing);
    } else if (this.player.groundedStringId && this.player.velocityY > 0) {
      if (this.player.coyoteTimer <= 0) this.player.groundedStringId = null;
    }

    this.heightClimbed = Math.max(this.heightClimbed, -this.player.y);

    this.camera.update(this.player.y, this.viewportHeight, dt);
    this.maintainPlatformWindow();
    this.updateDeformation();
    this.checkFailure();
    this.checkVictory();
  }

  private updateFallingOut(dt: number): void {
    this.player = integratePlayer(this.player, dt);
    this.updateDeformation();
    this.fallingOutTimer -= dt;
    if (this.fallingOutTimer <= 0) {
      this.controller.transition("gameOver");
      this.loop.stop();
    }
  }

  private resolveLanding(
    landing: NonNullable<ReturnType<typeof detectLanding>>,
  ): void {
    const platform = this.platforms.find((p) => p.id === landing.platformId);
    if (!platform) return;

    const bounceSpeed = STRUMRISE_CONFIG.physics.bounce[platform.kind];
    this.player = applyBounce(
      { ...this.player, y: landing.y, x: landing.x },
      bounceSpeed,
      platform.id,
    );
    this.platformCooldowns[platform.id] =
      this.simTime + STRUMRISE_CONFIG.generation.landingCooldownSeconds;
    this.lastLandingAt = this.simTime;

    const heightGained = Math.max(0, -platform.y);
    const scoreResult = this.score.registerLanding(platform.kind, heightGained);
    this.player.combo = scoreResult.combo;

    this.landingEvents.push({
      platformId: platform.id,
      kind: platform.kind,
      x: landing.x,
      y: landing.y,
      combo: scoreResult.combo,
      pointsAwarded: scoreResult.pointsAwarded,
    });

    const pan = clamp((landing.contactPosition - 0.5) * 1.6, -0.9, 0.9);
    const velocity = clamp(
      0.4 + Math.min(1, scoreResult.combo / 12) * 0.6,
      0,
      1,
    );
    const articulation =
      platform.kind === "bass"
        ? "bass"
        : platform.kind === "treble"
          ? "harmonic"
          : "pluck";

    this.musicalEvents.push({
      midiNote: platform.note.midiNote,
      frequency: platform.note.frequency,
      velocity,
      brightness:
        platform.kind === "treble"
          ? 0.85
          : platform.kind === "bass"
            ? 0.3
            : 0.55,
      damping: platform.kind === "bass" ? 0.6 : 0.4,
      pan,
      reverbSend: clamp(scoreResult.combo / 14, 0, 0.5),
      articulation,
      scheduledTime: 0,
    });
  }

  private maintainPlatformWindow(): void {
    const cfg = STRUMRISE_CONFIG.generation;
    const floor = this.camera.getY() + this.viewportHeight + 300;
    this.platforms = this.platforms.filter((p) => p.y < floor);

    let guard = 0;
    while (
      this.platforms.length < cfg.windowAhead + 2 &&
      this.platforms.length < cfg.maxActivePlatforms &&
      guard < cfg.windowAhead + 2
    ) {
      this.platforms.push(this.generator.generateNext(this.nextId()));
      guard += 1;
    }
  }

  private checkFailure(): void {
    const missThreshold =
      this.camera.getY() +
      this.viewportHeight +
      STRUMRISE_CONFIG.viewport.missMarginBelowCamera;
    if (this.player.y <= missThreshold) return;
    if (this.player.invulnerableTimer > 0) return;

    this.player = { ...this.player, lives: this.player.lives - 1 };
    if (this.player.lives <= 0) {
      this.fallingOutTimer = STRUMRISE_CONFIG.fallingOutDurationSeconds;
      this.controller.transition("fallingOut");
    } else {
      this.respawnAtLastPlatform();
    }
  }

  private respawnAtLastPlatform(): void {
    const respawn =
      this.platforms.find((p) => p.id === this.player.groundedStringId) ??
      this.platforms[0];
    const livesRemaining = this.player.lives;
    const x = respawn.x + respawn.width / 2;
    const y = respawn.y - 20;
    this.player = {
      x,
      y,
      previousX: x,
      previousY: y,
      velocityX: 0,
      velocityY: 0,
      groundedStringId: respawn.id,
      coyoteTimer: STRUMRISE_CONFIG.physics.coyoteTimeSeconds,
      inputX: 0,
      combo: 0,
      lives: livesRemaining,
      energy: 0,
      invulnerableTimer: STRUMRISE_CONFIG.physics.invulnerableSeconds,
    };
    this.score.resetCombo();
  }

  private checkVictory(): void {
    if (this.heightClimbed < STRUMRISE_CONFIG.sector.heightTarget) return;
    if (this.controller.transition("sectorComplete")) {
      this.controller.transition("victory");
      this.loop.stop();
    }
  }

  private updateDeformation(): void {
    const speed = Math.abs(this.player.velocityY);
    const fallFactor = clamp(speed / 700, 0, 1.3);
    const sinceLanding = this.simTime - this.lastLandingAt;
    const impact = sinceLanding < 0.4 ? clamp(1 - sinceLanding / 0.4, 0, 1) : 0;
    const rising = this.player.velocityY < 0;

    const target: BodyDeformation = {
      longitudinalScale: 1 + (rising ? fallFactor * 0.12 : -impact * 0.25),
      lateralScale: 1 + (rising ? -fallFactor * 0.05 : impact * 0.3),
      headSquash: impact * 0.5,
      tailStretch: rising ? fallFactor * 0.4 : 0,
      finSpread: fallFactor * 0.2,
      impactWave: impact,
      tumbleRotation: clamp(this.player.velocityX / 500, -0.4, 0.4),
    };

    const rate = this.reducedMotion ? 1 : 0.3;
    this.deformation = {
      longitudinalScale: lerp(
        this.deformation.longitudinalScale,
        target.longitudinalScale,
        rate,
      ),
      lateralScale: lerp(
        this.deformation.lateralScale,
        target.lateralScale,
        rate,
      ),
      headSquash: lerp(this.deformation.headSquash, target.headSquash, rate),
      tailStretch: lerp(this.deformation.tailStretch, target.tailStretch, rate),
      finSpread: lerp(this.deformation.finSpread, target.finSpread, rate),
      impactWave: lerp(this.deformation.impactWave, target.impactWave, rate),
      tumbleRotation: lerp(
        this.deformation.tumbleRotation,
        target.tumbleRotation,
        rate,
      ),
    };
  }
}
