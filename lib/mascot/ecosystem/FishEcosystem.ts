import type { AppearancePalette } from "../appearance/AppearancePresets";
import type { WanderBounds } from "../behavior/WanderPlanner";
import { clamp, lerp } from "../core/NumericGuards";
import { SeededRandom } from "../core/SeededRandom";
import { MascotRuntime } from "../MascotRuntime";
import type {
  AppearancePresetName,
  EcosystemFissionPhase,
  MascotAction,
  MascotEcosystemStatus,
  MascotQuality,
  Point,
} from "../types";
import {
  anatomyAfterFission,
  createBaseAnatomy,
  maxSpineLengthForBounds,
  MEALS_TO_FISSION,
  resolveAnatomyForMeals,
  spineLengthPx,
  type AnatomyState,
} from "./AnatomyGrowth";
import {
  FRY_SCHOOL_SIZE,
  MAX_ADULT_FISH,
  PopulationModel,
} from "./PopulationModel";
import { computeFryDesiredVelocity } from "./FrySteering";

const FRY_CATCH_RADIUS = 22;
const FRY_MIN_CATCH_AGE = 1.35;
const FRY_FATIGUE_AGE = 11;
const FRY_HUNT_GRACE_SECONDS = 2.1;
const FISSION_DURATION = 2.2;
const REDUCED_FISSION_DURATION = 0.85;
const REDUCED_CATCH_ASSIST_RADIUS = 90;
const HUNT_HUNGER_THRESHOLD = 0.42;
const HUNGER_PER_SECOND = 0.06;
const NATURAL_SCHOOL_SIZE = 4;
const FIRST_SCHOOL_DELAY = [3.8, 5.4] as const;
const SCHOOL_RESPAWN_DELAY = [6.5, 10.5] as const;
const REPRODUCTION_SETTLE_DELAY = [1.8, 2.4] as const;
const FRY_COLORS = [
  "#ffb178",
  "#8fe9c9",
  "#cbb2ff",
  "#91d9dc",
  "#ffd27a",
] as const;
/** Tight drop radius around the egg click — user places the school. */
const FRY_DROP_RADIUS = 54;

const MOONLIT_KOI_PALETTE: AppearancePalette = {
  name: "Moonlit Koi",
  base: "#33252d",
  highlight: "#e8b9c8",
  printPrimary: "#ff8a61",
  printSecondary: "#91d9dc",
  face: "#fff2e8",
  shadow: "#160f14",
  rim: "#d5a7b8",
};

const COMPANION_PRESETS: readonly AppearancePresetName[] = [
  "cute-bean",
  "signal-manta",
  "velvet-comet",
  "cute-bean",
];

export interface EcosystemAdult {
  id: string;
  role: "leader" | "companion";
  runtime: MascotRuntime;
  mealsEaten: number;
  anatomy: AnatomyState;
  /** Soft visual pulse only — simulated size comes from anatomy. */
  scale: number;
  targetScale: number;
  feedPulse: number;
  preferredSide: 1 | -1;
  phaseOffset: number;
  laneBias: number;
  preferredSpeed: number;
  /** Appetite is deliberately slow so predation reads as a choice, not noise. */
  hunger: number;
  digestionSeconds: number;
  pursuitBurstSeconds: number;
  coastSeconds: number;
  coastTarget: Point | null;
}

export interface EcosystemFry {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  age: number;
  tailPhase: number;
  color: string;
  dodgeSign: 1 | -1;
  hideTarget: Point | null;
  nextHideAt: number;
  burstCooldown: number;
}

export interface EcosystemFissionVisual {
  phase: EcosystemFissionPhase;
  progress: number;
  parentOrigins: readonly Point[];
}

interface FissionState {
  elapsed: number;
  duration: number;
  parentIndex: number;
  spawned: boolean;
  parentOrigin: Point;
  axisAngle: number;
  parentWasLeader: boolean;
  childAnatomy: AnatomyState;
  parentMeals: number;
}

interface ReproductionState {
  adultId: string;
  elapsed: number;
  duration: number;
  settlePoint: Point;
}

export interface FishEcosystemOptions {
  leader: MascotRuntime;
  seed: number;
  quality: MascotQuality;
  bounds: WanderBounds;
  createRuntime: (
    seed: number,
    originX: number,
    originY: number,
    index: number,
  ) => MascotRuntime;
  getHideTargets?: () => readonly Point[];
  onStatus?: (status: MascotEcosystemStatus) => void;
  autoPopulate?: boolean;
}

/**
 * Bounded multi-creature coordinator. The existing runtime remains the leader;
 * companions reuse the same simulation class but share the engine's one fixed
 * loop, renderer, DOM registry and audio director.
 */
export class FishEcosystem {
  private readonly population = new PopulationModel();
  private readonly rng: SeededRandom;
  private readonly createRuntime: FishEcosystemOptions["createRuntime"];
  private readonly onStatus?: FishEcosystemOptions["onStatus"];
  private readonly getHideTargets?: FishEcosystemOptions["getHideTargets"];
  private readonly autoPopulate: boolean;
  private readonly adults: EcosystemAdult[];
  private bounds: WanderBounds;
  private quality: MascotQuality;
  private fry: EcosystemFry[] = [];
  private fission: FissionState | null = null;
  private reproduction: ReproductionState | null = null;
  private pointer = { x: 0, y: 0, active: false };
  private pointerSuppressed = false;
  private simTime = 0;
  private spawnCooldown = 0;
  private bloomSeconds = 0;
  private reducedMotion = false;
  private enabled = true;
  private lastStatusKey = "";
  /** adult index -> fry index they are currently hunting */
  private huntAssignments: Array<number | null> = [];
  private divergenceSeconds = 0;
  private nextFryId = 1;
  private nextNaturalSchoolAt = 0;

  constructor(options: FishEcosystemOptions) {
    this.rng = new SeededRandom(options.seed + 0x5f3759df);
    this.createRuntime = options.createRuntime;
    this.onStatus = options.onStatus;
    this.getHideTargets = options.getHideTargets;
    this.autoPopulate = options.autoPopulate ?? false;
    this.bounds = options.bounds;
    this.quality = options.quality;
    const anatomy = createBaseAnatomy(0);
    options.leader.applyAnatomy(anatomy);
    this.adults = [
      {
        id: "signal-leader",
        role: "leader",
        runtime: options.leader,
        mealsEaten: 0,
        anatomy,
        scale: 1,
        targetScale: 1,
        feedPulse: 0,
        preferredSide: 1,
        phaseOffset: 0,
        laneBias: 0,
        preferredSpeed: 1,
        hunger: 0.72,
        digestionSeconds: 0,
        pursuitBurstSeconds: 0,
        coastSeconds: 0,
        coastTarget: null,
      },
    ];
    this.nextNaturalSchoolAt = this.rng.range(...FIRST_SCHOOL_DELAY);
    this.emitStatus(true);
  }

  getAdults(): readonly EcosystemAdult[] {
    return this.adults;
  }

  getFry(): EcosystemFry | null {
    return this.fry[0] ?? null;
  }

  getAllFry(): readonly EcosystemFry[] {
    return this.fry;
  }

  hitTestLeader(x: number, y: number, padding = 12): boolean {
    return this.adults[0]?.runtime.hitTest(x, y, padding) ?? false;
  }

  getBloomStrength(): number {
    if (this.bloomSeconds <= 0) return 0;
    return clamp(this.bloomSeconds / 1.25, 0, 1);
  }

  getFissionVisual(): EcosystemFissionVisual | null {
    if (!this.fission) return null;
    const progress = clamp(
      this.fission.elapsed / Math.max(0.001, this.fission.duration),
      0,
      1,
    );
    return {
      phase: phaseForProgress(progress),
      progress,
      parentOrigins: [this.fission.parentOrigin],
    };
  }

  getStatus(): MascotEcosystemStatus {
    const canRelease =
      this.enabled &&
      this.spawnCooldown <= 0 &&
      this.fry.length === 0 &&
      !this.fission &&
      !this.reproduction &&
      !this.population.isFissionPending();
    const leader = this.adults.find((adult) => adult.role === "leader");
    const meals = leader?.mealsEaten ?? 0;
    const status = this.population.getStatus(
      canRelease,
      meals,
      Math.max(0, MEALS_TO_FISSION - meals),
    );
    status.fissionPhase = this.reproduction
      ? "settle"
      : (this.getFissionVisual()?.phase ?? null);
    return status;
  }

  setPointer(x: number, y: number, active: boolean): void {
    if (Number.isFinite(x)) this.pointer.x = x;
    if (Number.isFinite(y)) this.pointer.y = y;
    this.pointer.active = active;
  }

  setPointerSuppressed(suppressed: boolean): void {
    this.pointerSuppressed = suppressed;
  }

  isPointerSuppressed(): boolean {
    return this.pointerSuppressed;
  }

  setScrollVelocity(value: number): void {
    for (const adult of this.adults) adult.runtime.setScrollVelocity(value);
  }

  setBounds(bounds: WanderBounds): void {
    this.bounds = bounds;
    for (const adult of this.adults) adult.runtime.setBounds(bounds);
    for (const fry of this.fry) {
      fry.x = clamp(fry.x, bounds.minX, bounds.maxX);
      fry.y = clamp(fry.y, bounds.minY, bounds.maxY);
    }
  }

  setQuality(quality: MascotQuality): void {
    this.quality = quality;
    for (const adult of this.adults) adult.runtime.setQuality(quality);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    for (const adult of this.adults) adult.runtime.setEnabled(enabled);
    this.emitStatus();
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    for (const adult of this.adults) adult.runtime.setReducedMotion(reduced);
  }

  trigger(action: MascotAction): void {
    if (action.type === "releaseFry") {
      this.releaseFry(action.x, action.y);
      return;
    }
    if (action.type === "callFish") {
      // Retained for motion-lab / debug; normal UX hunts automatically.
      this.callFish();
      return;
    }

    if (action.type === "click") {
      this.adults[0]?.runtime.trigger(action);
      return;
    }
    for (const adult of this.adults) adult.runtime.trigger(action);
  }

  /**
   * One egg click scatters a school of shy fry across the page. Pass `count`
   * to override (tests often use 1 for precise meal accounting).
   */
  releaseFry(x?: number, y?: number, count: number = FRY_SCHOOL_SIZE): boolean {
    if (
      !this.enabled ||
      this.spawnCooldown > 0 ||
      this.fission ||
      this.reproduction
    ) {
      return false;
    }
    const granted = this.population.requestSchool(count);
    if (granted <= 0) return false;

    const originX = clamp(
      Number.isFinite(x)
        ? (x as number)
        : lerp(this.bounds.minX, this.bounds.maxX, 0.78),
      this.bounds.minX,
      this.bounds.maxX,
    );
    const originY = clamp(
      Number.isFinite(y)
        ? (y as number)
        : lerp(this.bounds.minY, this.bounds.maxY, 0.3),
      this.bounds.minY,
      this.bounds.maxY,
    );

    this.fry = [];
    for (let index = 0; index < granted; index += 1) {
      this.fry.push(this.createDroppedFry(originX, originY, index, granted));
    }
    this.spawnCooldown = 2.4;
    this.nextNaturalSchoolAt =
      this.simTime + this.rng.range(...SCHOOL_RESPAWN_DELAY);
    this.huntAssignments = this.adults.map(() => null);
    this.emitStatus();
    return true;
  }

  callFish(): void {
    if (this.fry.length === 0 || this.fission) return;
    this.assignHunters();
  }

  update(dt: number): void {
    if (!this.enabled || !Number.isFinite(dt) || dt <= 0) return;
    this.simTime += dt;
    this.spawnCooldown = Math.max(0, this.spawnCooldown - dt);
    this.bloomSeconds = Math.max(0, this.bloomSeconds - dt);
    this.divergenceSeconds = Math.max(0, this.divergenceSeconds - dt);

    for (const adult of this.adults) this.updateAdultState(adult, dt);

    if (
      this.autoPopulate &&
      this.simTime >= this.nextNaturalSchoolAt &&
      this.fry.length === 0 &&
      !this.fission &&
      !this.reproduction &&
      !this.population.isFissionPending()
    ) {
      this.releaseNaturalSchool();
    }

    if (this.fission) this.updateFission(dt);
    else if (this.reproduction) this.updateReproduction(dt);

    // Reason: fry move first so predators chase current positions.
    if (this.fry.length > 0 && !this.fission) {
      for (const fry of this.fry) this.updateFry(dt, fry);
    }

    this.routeAdultTargets();

    for (const adult of this.adults) {
      adult.feedPulse = Math.max(0, adult.feedPulse - dt * 1.8);
      adult.targetScale = this.resolveTargetScale(adult);
      adult.scale = lerp(adult.scale, adult.targetScale, clamp(dt * 4.2, 0, 1));
      adult.runtime.update(dt);
    }

    if (this.fry.length > 0 && !this.fission) this.checkFryCatch();

    this.emitStatus();
  }

  private updateAdultState(adult: EcosystemAdult, dt: number): void {
    adult.hunger = clamp(adult.hunger + dt * HUNGER_PER_SECOND, 0, 1);
    adult.digestionSeconds = Math.max(0, adult.digestionSeconds - dt);
    adult.coastSeconds = Math.max(0, adult.coastSeconds - dt);
    if (adult.coastSeconds === 0) adult.coastTarget = null;

    const wasBursting = adult.pursuitBurstSeconds > 0;
    adult.pursuitBurstSeconds = Math.max(
      0,
      adult.pursuitBurstSeconds - dt,
    );
    if (wasBursting && adult.pursuitBurstSeconds === 0) {
      // A short coast phase creates a visible observe/act rhythm and prevents
      // the adult from pinning a fry with continuous acceleration.
      adult.coastSeconds = this.rng.range(0.16, 0.28);
      const root = adult.runtime.pose.getRoot();
      const velocity = adult.runtime.pose.getVelocity();
      adult.coastTarget = {
        x: clamp(
          root.x + velocity.x * 0.2,
          this.bounds.minX,
          this.bounds.maxX,
        ),
        y: clamp(
          root.y + velocity.y * 0.2,
          this.bounds.minY,
          this.bounds.maxY,
        ),
      };
    }
  }

  private releaseNaturalSchool(): void {
    const fromRight = this.rng.next() > 0.5;
    const x = fromRight
      ? lerp(this.bounds.minX, this.bounds.maxX, 0.8)
      : lerp(this.bounds.minX, this.bounds.maxX, 0.2);
    const y = this.rng.range(
      lerp(this.bounds.minY, this.bounds.maxY, 0.24),
      lerp(this.bounds.minY, this.bounds.maxY, 0.62),
    );

    if (!this.releaseFry(x, y, NATURAL_SCHOOL_SIZE)) {
      this.nextNaturalSchoolAt = this.simTime + 1.5;
    }
  }

  private createDroppedFry(
    originX: number,
    originY: number,
    index: number,
    total: number,
  ): EcosystemFry {
    // Reason: fry must appear where the user clicked the egg — a tight ring,
    // not a random page-wide scatter.
    const angle =
      (index / Math.max(1, total)) * Math.PI * 2 + this.rng.range(-0.25, 0.25);
    const radius =
      total <= 1 ? 0 : 16 + (index / Math.max(1, total - 1)) * FRY_DROP_RADIUS;
    const x = clamp(
      originX + Math.cos(angle) * radius + this.rng.range(-6, 6),
      this.bounds.minX,
      this.bounds.maxX,
    );
    const y = clamp(
      originY + Math.sin(angle) * radius + this.rng.range(-6, 6),
      this.bounds.minY,
      this.bounds.maxY,
    );
    const heading = angle + Math.PI + this.rng.range(-0.4, 0.4);
    const speed = this.rng.range(22, 36);
    const fry: EcosystemFry = {
      id: `fry-${this.nextFryId++}`,
      x,
      y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed,
      heading,
      age: 0,
      tailPhase: this.rng.angle(),
      color: FRY_COLORS[index % FRY_COLORS.length],
      dodgeSign: index % 2 === 0 ? 1 : -1,
      hideTarget: null,
      nextHideAt: this.rng.range(0.6, 1.4),
      burstCooldown: 0,
    };
    this.refreshFryHideTarget(fry);
    return fry;
  }

  private routeAdultTargets(): void {
    if (this.fission) {
      this.routeFissionTargets();
      return;
    }
    if (this.reproduction) {
      this.routeReproductionTargets();
      return;
    }

    if (this.fry.length > 0 && this.canHuntYet()) this.assignHunters();
    else this.huntAssignments = this.adults.map(() => null);

    for (let index = 0; index < this.adults.length; index += 1) {
      const adult = this.adults[index];
      const preyIndex = this.huntAssignments[index];
      const prey =
        preyIndex !== null && preyIndex !== undefined
          ? this.fry[preyIndex]
          : null;

      if (adult.coastSeconds > 0 && adult.coastTarget) {
        adult.runtime.setPointer(0, 0, false);
        adult.runtime.setSteerTarget(
          adult.coastTarget.x,
          adult.coastTarget.y,
          false,
        );
        continue;
      }

      if (adult.role === "leader") {
        if (prey) {
          const intercept = this.predictIntercept(adult, prey);
          adult.runtime.clearSteerTarget();
          adult.runtime.setPointer(intercept.x, intercept.y, false);
          adult.runtime.setSteerTarget(intercept.x, intercept.y, true);
        } else if (this.pointerSuppressed) {
          adult.runtime.clearSteerTarget();
          adult.runtime.setPointer(this.pointer.x, this.pointer.y, false);
        } else {
          adult.runtime.clearSteerTarget();
          adult.runtime.setPointer(
            this.pointer.x,
            this.pointer.y,
            this.pointer.active,
          );
        }
        continue;
      }

      adult.runtime.setPointer(0, 0, false);
      if (prey) {
        const intercept = this.predictIntercept(adult, prey);
        adult.runtime.setSteerTarget(intercept.x, intercept.y, true);
      } else {
        const target = this.independentTarget(index);
        adult.runtime.setSteerTarget(target.x, target.y, false);
      }
    }
  }

  private canHuntYet(): boolean {
    if (this.fry.length === 0) return false;
    // Give freshly dropped fry a head start before adults commit to chase.
    return this.fry.some((fry) => fry.age >= FRY_HUNT_GRACE_SECONDS);
  }

  private assignHunters(): void {
    this.huntAssignments = this.adults.map(() => null);
    if (this.fry.length === 0 || this.adults.length === 0) return;

    const claimed = new Set<number>();
    const adultsByHunger = this.adults
      .map((adult, index) => ({ adult, index }))
      .sort((a, b) => b.adult.hunger - a.adult.hunger);

    for (const { adult, index } of adultsByHunger) {
      const userHasLeader =
        adult.role === "leader" &&
        this.pointer.active &&
        !this.pointerSuppressed;
      if (
        userHasLeader ||
        adult.hunger < HUNT_HUNGER_THRESHOLD ||
        adult.digestionSeconds > 0 ||
        adult.coastSeconds > 0
      ) {
        continue;
      }
      if (adult.pursuitBurstSeconds <= 0) {
        adult.pursuitBurstSeconds = this.rng.range(0.72, 1.08);
      }

      const root = adult.runtime.pose.getRoot();
      let bestFry = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let fryIndex = 0; fryIndex < this.fry.length; fryIndex += 1) {
        if (claimed.has(fryIndex)) continue;
        const fry = this.fry[fryIndex];
        if (fry.age < FRY_HUNT_GRACE_SECONDS) continue;
        const distance = Math.hypot(root.x - fry.x, root.y - fry.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestFry = fryIndex;
        }
      }
      if (bestFry >= 0) {
        claimed.add(bestFry);
        this.huntAssignments[index] = bestFry;
      }
    }
  }

  private predictIntercept(
    adult: EcosystemAdult,
    prey: EcosystemFry,
  ): Point {
    const root = adult.runtime.pose.getRoot();
    const distance = Math.hypot(prey.x - root.x, prey.y - root.y);
    const lookAhead = clamp(distance / 240, 0.08, 0.5);
    return {
      x: clamp(
        prey.x + prey.vx * lookAhead,
        this.bounds.minX,
        this.bounds.maxX,
      ),
      y: clamp(
        prey.y + prey.vy * lookAhead,
        this.bounds.minY,
        this.bounds.maxY,
      ),
    };
  }

  private independentTarget(index: number): Point {
    const adult = this.adults[index];
    const root = adult.runtime.pose.getRoot();
    const phase = this.simTime * adult.preferredSpeed + adult.phaseOffset;
    const wanderRadius = 70 + adult.laneBias * 18;
    const target: Point = {
      x:
        root.x +
        Math.cos(phase * 0.55 + adult.phaseOffset) * wanderRadius +
        Math.sin(phase * 0.21) * 24,
      y:
        root.y +
        Math.sin(phase * 0.47 + adult.phaseOffset * 1.3) * wanderRadius * 0.72 +
        Math.cos(phase * 0.19) * 18,
    };

    // Soft attraction to leader so the shoal stays related without lockstep.
    const leader = this.adults.find((entry) => entry.role === "leader");
    if (leader && this.divergenceSeconds <= 0) {
      const leaderRoot = leader.runtime.pose.getRoot();
      const toLeaderX = leaderRoot.x - root.x;
      const toLeaderY = leaderRoot.y - root.y;
      const leaderDistance = Math.hypot(toLeaderX, toLeaderY);
      if (leaderDistance > 160) {
        target.x += toLeaderX * 0.18;
        target.y += toLeaderY * 0.18;
      }
    }

    for (let otherIndex = 0; otherIndex < this.adults.length; otherIndex += 1) {
      if (otherIndex === index) continue;
      const other = this.adults[otherIndex].runtime.pose.getRoot();
      const dx = root.x - other.x;
      const dy = root.y - other.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      if (distance < 56) {
        const push = (56 - distance) * 1.35;
        target.x += (dx / distance) * push;
        target.y += (dy / distance) * push;
      }
    }

    if (this.divergenceSeconds > 0) {
      const burst =
        Math.sin(adult.phaseOffset) * 90 * (this.divergenceSeconds / 0.7);
      target.x += Math.cos(adult.phaseOffset) * burst;
      target.y += Math.sin(adult.phaseOffset * 1.7) * burst;
    }

    return {
      x: clamp(target.x, this.bounds.minX, this.bounds.maxX),
      y: clamp(target.y, this.bounds.minY, this.bounds.maxY),
    };
  }

  private updateFry(dt: number, fry: EcosystemFry): void {
    fry.age += dt;
    fry.tailPhase += dt * (fry.burstCooldown > 0 ? 14 : 9);
    fry.burstCooldown = Math.max(0, fry.burstCooldown - dt);
    if (fry.age >= fry.nextHideAt) this.refreshFryHideTarget(fry);

    const fatigue = clamp(
      (fry.age - FRY_FATIGUE_AGE * 0.28) / FRY_FATIGUE_AGE,
      0,
      1,
    );

    const assignedHunterIndex = this.huntAssignments.findIndex(
      (preyIndex) => preyIndex !== null && this.fry[preyIndex]?.id === fry.id,
    );
    const hunter =
      assignedHunterIndex >= 0 ? this.adults[assignedHunterIndex] : null;
    if (
      this.reducedMotion &&
      hunter &&
      Math.hypot(
        hunter.runtime.pose.getRoot().x - fry.x,
        hunter.runtime.pose.getRoot().y - fry.y,
      ) < REDUCED_CATCH_ASSIST_RADIUS
    ) {
      const root = hunter.runtime.pose.getRoot();
      fry.x = lerp(fry.x, root.x, clamp(dt * 2.4, 0, 1));
      fry.y = lerp(fry.y, root.y, clamp(dt * 2.4, 0, 1));
      fry.vx *= 0.8;
      fry.vy *= 0.8;
      return;
    }

    const threats = this.adults.map((adult) => {
      const root = adult.runtime.pose.getRoot();
      const velocity = adult.runtime.pose.getVelocity();
      return {
        x: root.x,
        y: root.y,
        vx: velocity.x,
        vy: velocity.y,
      };
    });
    const neighbors = this.fry
      .filter((other) => other.id !== fry.id)
      .map((other) => ({ x: other.x, y: other.y }));

    const steered = computeFryDesiredVelocity({
      x: fry.x,
      y: fry.y,
      vx: fry.vx,
      vy: fry.vy,
      age: fry.age,
      fatigue,
      dodgeSign: fry.dodgeSign,
      reducedMotion: this.reducedMotion,
      threats,
      pointer:
        this.pointer.active && !this.pointerSuppressed ? this.pointer : null,
      hideTarget: fry.hideTarget,
      neighbors,
      bounds: this.bounds,
    });

    let desiredX = steered.desiredVx;
    let desiredY = steered.desiredVy;
    let maxSpeed = steered.maxSpeed;
    if (steered.burst && fry.burstCooldown <= 0) {
      fry.burstCooldown = 0.55;
    }
    if (fry.burstCooldown > 0) {
      maxSpeed *= 1.2;
    }

    const speed = Math.hypot(desiredX, desiredY);
    if (speed > maxSpeed && speed > 0) {
      desiredX = (desiredX / speed) * maxSpeed;
      desiredY = (desiredY / speed) * maxSpeed;
    }

    // Snappier acceleration while bursting so escape reads as a dart, not a drift.
    const accel = fry.burstCooldown > 0 ? 7.5 : 4.4;
    fry.vx = lerp(fry.vx, desiredX, clamp(dt * accel, 0, 1));
    fry.vy = lerp(fry.vy, desiredY, clamp(dt * accel, 0, 1));
    fry.x = clamp(fry.x + fry.vx * dt, this.bounds.minX, this.bounds.maxX);
    fry.y = clamp(fry.y + fry.vy * dt, this.bounds.minY, this.bounds.maxY);
    if (Math.hypot(fry.vx, fry.vy) > 1) {
      fry.heading = Math.atan2(fry.vy, fry.vx);
    }
  }

  private checkFryCatch(): void {
    if (this.fry.length === 0 || this.reproduction) return;
    // One catch per adult per frame keeps multi-hunter schools fair.
    const adultsBusy = new Set<number>();

    for (let fryIndex = 0; fryIndex < this.fry.length; fryIndex += 1) {
      const fry = this.fry[fryIndex];
      if (fry.age < FRY_MIN_CATCH_AGE) continue;

      for (
        let adultIndex = 0;
        adultIndex < this.adults.length;
        adultIndex += 1
      ) {
        if (adultsBusy.has(adultIndex)) continue;
        const adult = this.adults[adultIndex];
        if (
          this.huntAssignments[adultIndex] !== fryIndex ||
          adult.digestionSeconds > 0
        ) {
          continue;
        }
        const root = adult.runtime.pose.getRoot();
        const catchRadius =
          FRY_CATCH_RADIUS *
          (0.85 + adult.anatomy.bodyProfile.maxWidth / 40) *
          (this.reducedMotion ? 1.35 : 1);
        if (Math.hypot(root.x - fry.x, root.y - fry.y) > catchRadius) {
          continue;
        }

        const caughtAt = { x: fry.x, y: fry.y };
        adult.mealsEaten = Math.min(MEALS_TO_FISSION, adult.mealsEaten + 1);
        this.applyGrowthToAdult(adult);

        const canSplit =
          adult.mealsEaten >= MEALS_TO_FISSION &&
          this.population.canSplitOneAdult();
        const outcome = this.population.consumeFry(adult.mealsEaten, canSplit);
        this.fry.splice(fryIndex, 1);
        adultsBusy.add(adultIndex);
        adult.feedPulse = 1;
        adult.hunger = 0.05;
        adult.digestionSeconds = this.rng.range(2.8, 4.4);
        adult.pursuitBurstSeconds = 0;
        adult.coastSeconds = this.rng.range(0.65, 1.05);
        adult.coastTarget = null;
        adult.runtime.trigger({ type: "click", x: caughtAt.x, y: caughtAt.y });

        if (outcome === "fission") {
          this.scheduleReproduction(adult);
          this.emitStatus(true);
          return;
        }
        if (outcome === "bloom") {
          this.bloomSeconds = 1.25;
          for (const member of this.adults) member.feedPulse = 1;
        }
        this.emitStatus(true);
        if (this.fry.length === 0) {
          this.nextNaturalSchoolAt =
            this.simTime + this.rng.range(...SCHOOL_RESPAWN_DELAY);
        }
        fryIndex -= 1;
        break;
      }
    }
  }

  private refreshFryHideTarget(fry: EcosystemFry): void {
    const candidates = this.getHideTargets?.() ?? [];
    if (candidates.length === 0) {
      fry.hideTarget = {
        x: this.rng.range(this.bounds.minX, this.bounds.maxX),
        y: this.rng.range(this.bounds.minY, this.bounds.maxY),
      };
    } else {
      // Prefer cover far from the nearest adult when possible.
      let best = candidates[0];
      let bestScore = -Infinity;
      for (const candidate of candidates) {
        let nearestAdult = Infinity;
        for (const adult of this.adults) {
          const root = adult.runtime.pose.getRoot();
          nearestAdult = Math.min(
            nearestAdult,
            Math.hypot(candidate.x - root.x, candidate.y - root.y),
          );
        }
        const score = nearestAdult + this.rng.range(0, 40);
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      fry.hideTarget = { x: best.x, y: best.y };
    }
    fry.nextHideAt = fry.age + this.rng.range(1.8, 3.6);
  }

  private applyGrowthToAdult(adult: EcosystemAdult): void {
    const maxLength = maxSpineLengthForBounds(
      this.bounds.maxX - this.bounds.minX,
      this.bounds.maxY - this.bounds.minY,
    );
    const next = resolveAnatomyForMeals(adult.mealsEaten, {
      maxSpineLength: maxLength,
    });
    adult.anatomy = next;
    adult.runtime.applyAnatomy(next);
  }

  private scheduleReproduction(adult: EcosystemAdult): void {
    const root = adult.runtime.pose.getRoot();
    this.reproduction = {
      adultId: adult.id,
      elapsed: 0,
      duration: this.reducedMotion
        ? 0.9
        : this.rng.range(...REPRODUCTION_SETTLE_DELAY),
      settlePoint: {
        x: clamp(root.x, this.bounds.minX, this.bounds.maxX),
        y: clamp(root.y, this.bounds.minY, this.bounds.maxY),
      },
    };
    this.huntAssignments = this.adults.map(() => null);
  }

  private updateReproduction(dt: number): void {
    if (!this.reproduction) return;
    this.reproduction.elapsed += dt;
    if (this.reproduction.elapsed < this.reproduction.duration) return;

    const adult = this.adults.find(
      (candidate) => candidate.id === this.reproduction?.adultId,
    );
    this.reproduction = null;
    if (adult) this.beginFission(adult);
  }

  private routeReproductionTargets(): void {
    if (!this.reproduction) return;
    for (let index = 0; index < this.adults.length; index += 1) {
      const adult = this.adults[index];
      adult.runtime.setPointer(0, 0, false);
      if (adult.id === this.reproduction.adultId) {
        adult.runtime.setSteerTarget(
          this.reproduction.settlePoint.x,
          this.reproduction.settlePoint.y,
          false,
        );
      } else {
        const target = this.independentTarget(index);
        adult.runtime.setSteerTarget(target.x, target.y, false);
      }
    }
  }

  private beginFission(parent: EcosystemAdult): void {
    if (
      !this.population.canSplitOneAdult() &&
      !this.population.isFissionPending()
    ) {
      return;
    }
    const parentIndex = this.adults.indexOf(parent);
    if (parentIndex < 0) return;
    const origin = parent.runtime.pose.getRoot();
    const heading = parent.runtime.pose.getHeading();
    this.fission = {
      elapsed: 0,
      duration: this.reducedMotion
        ? REDUCED_FISSION_DURATION
        : FISSION_DURATION,
      parentIndex,
      spawned: false,
      parentOrigin: { x: origin.x, y: origin.y },
      axisAngle: heading + Math.PI / 2,
      parentWasLeader: parent.role === "leader",
      childAnatomy: anatomyAfterFission(parent.mealsEaten),
      parentMeals: parent.mealsEaten,
    };
  }

  private updateFission(dt: number): void {
    if (!this.fission) return;
    this.fission.elapsed += dt;
    const progress = this.fission.elapsed / this.fission.duration;
    if (!this.fission.spawned && progress >= 0.58) this.spawnChildren();
    if (progress >= 1) {
      this.fission = null;
      this.emitStatus(true);
    }
  }

  private spawnChildren(): void {
    if (!this.fission || this.fission.spawned) return;
    this.fission.spawned = true;
    const parentIndex = this.fission.parentIndex;
    const parent = this.adults[parentIndex];
    if (!parent) return;

    const origin = this.fission.parentOrigin;
    const childAnatomy = this.fission.childAnatomy;
    const parentWasLeader = this.fission.parentWasLeader;
    const axis = this.fission.axisAngle;

    // Remove the dividing parent, then insert two equal children.
    parent.runtime.clearSteerTarget();
    this.adults.splice(parentIndex, 1);

    const children: EcosystemAdult[] = [];
    for (let side = 0; side < 2; side += 1) {
      const childIndex = this.adults.length + children.length;
      const seed = (this.rng.next() * 0x7fffffff) ^ (childIndex * 0x9e3779b9);
      const offset = (side === 0 ? -1 : 1) * 18;
      const runtime = this.createRuntime(
        Math.floor(seed) >>> 0,
        origin.x + Math.cos(axis) * offset,
        origin.y + Math.sin(axis) * offset,
        childIndex,
      );
      runtime.setQuality(this.quality);
      runtime.setEnabled(this.enabled);
      runtime.setReducedMotion(this.reducedMotion);
      runtime.applyAnatomy(childAnatomy);
      runtime.setAppearancePreset(COMPANION_PRESETS[childIndex % 4]);
      if (childIndex % 4 === 3) runtime.appearancePalette = MOONLIT_KOI_PALETTE;

      children.push({
        id: `signal-sibling-${childIndex}-${side}`,
        role: "companion",
        runtime,
        mealsEaten: 0,
        anatomy: childAnatomy,
        scale: 1,
        targetScale: 1,
        feedPulse: 0,
        preferredSide: side === 0 ? -1 : 1,
        phaseOffset: this.rng.range(0, Math.PI * 2),
        laneBias: this.rng.range(-1, 1),
        preferredSpeed: 0.75 + this.rng.next() * 0.55,
        hunger: this.rng.range(0.2, 0.36),
        digestionSeconds: 1.2,
        pursuitBurstSeconds: 0,
        coastSeconds: this.rng.range(0.4, 1.1),
        coastTarget: null,
      });
    }

    if (parentWasLeader) {
      children[0].role = "leader";
      children[0].id = "signal-leader";
      this.adults.unshift(...children);
    } else {
      this.adults.splice(parentIndex, 0, ...children);
    }

    // Ensure exactly one leader at index 0.
    const leaderIndex = this.adults.findIndex(
      (adult) => adult.role === "leader",
    );
    if (leaderIndex > 0) {
      const [leader] = this.adults.splice(leaderIndex, 1);
      this.adults.unshift(leader);
    } else if (leaderIndex < 0 && this.adults.length > 0) {
      this.adults[0].role = "leader";
    }
    for (let i = 1; i < this.adults.length; i += 1) {
      this.adults[i].role = "companion";
    }

    this.population.completeFission();
    this.divergenceSeconds = 0.7;
    if (this.fry.length === 0) {
      this.nextNaturalSchoolAt =
        this.simTime + this.rng.range(...SCHOOL_RESPAWN_DELAY);
    }
    this.emitStatus(true);
  }

  private routeFissionTargets(): void {
    if (!this.fission) return;
    const normalX = Math.cos(this.fission.axisAngle);
    const normalY = Math.sin(this.fission.axisAngle);
    const progress = clamp(this.fission.elapsed / this.fission.duration, 0, 1);
    const separation = progress < 0.52 ? 0 : ((progress - 0.52) / 0.48) * 64;
    const origin = this.fission.parentOrigin;

    if (!this.fission.spawned) {
      const parent = this.adults[this.fission.parentIndex];
      if (!parent) return;
      parent.runtime.setPointer(0, 0, false);
      parent.runtime.setSteerTarget(origin.x, origin.y, false);
      return;
    }

    // After spawn, push the two newest siblings apart along the fission axis.
    const start = Math.max(0, this.adults.length - 2);
    for (let index = start; index < this.adults.length; index += 1) {
      const side = index === start ? -1 : 1;
      this.adults[index].runtime.setPointer(0, 0, false);
      this.adults[index].runtime.setSteerTarget(
        origin.x + normalX * separation * side,
        origin.y + normalY * separation * side,
        true,
      );
    }
  }

  private resolveTargetScale(adult: EcosystemAdult): number {
    let scale = 1;
    scale += adult.feedPulse * 0.04;
    scale += this.getBloomStrength() * 0.035;
    // Tiny population shrink so four large anatomies stay readable.
    if (this.adults.length >= 4) scale *= 0.94;
    else if (this.adults.length >= 2) scale *= 0.97;

    if (this.fission && !this.fission.spawned) {
      const progress = clamp(
        this.fission.elapsed / this.fission.duration,
        0,
        1,
      );
      if (this.adults[this.fission.parentIndex] === adult) {
        scale += Math.sin(progress * Math.PI) * 0.1;
      }
    }
    return scale;
  }

  private emitStatus(force = false): void {
    if (!this.onStatus) return;
    const status = this.getStatus();
    const key = JSON.stringify(status);
    if (!force && key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    this.onStatus(status);
  }
}

/** @deprecated Prefer anatomy growth; kept for tests that assert bounded scales. */
export function baseScaleForPopulation(population: number): number {
  if (population <= 1) return 1;
  if (population === 2) return 0.92;
  return 0.8;
}

export function adultSpineLength(adult: EcosystemAdult): number {
  return spineLengthPx(adult.anatomy);
}

function phaseForProgress(progress: number): EcosystemFissionPhase {
  if (progress < 0.18) return "settle";
  if (progress < 0.4) return "round";
  if (progress < 0.58) return "seam";
  if (progress < 0.84) return "separate";
  return "recover";
}

export { FRY_SCHOOL_SIZE, MAX_ADULT_FISH, MEALS_TO_FISSION };
