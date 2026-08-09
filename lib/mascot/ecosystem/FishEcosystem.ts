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
import { PopulationModel } from "./PopulationModel";

const FRY_CATCH_RADIUS = 24;
const FRY_FLEE_RADIUS = 118;
const POINTER_FLEE_RADIUS = 72;
const FRY_MIN_CATCH_AGE = 0.72;
const FISSION_DURATION = 2.2;
const REDUCED_FISSION_DURATION = 0.9;

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
  scale: number;
  targetScale: number;
  feedPulse: number;
  preferredSide: 1 | -1;
  orbitSpeed: number;
}

export interface EcosystemFry {
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  age: number;
  tailPhase: number;
  color: string;
}

export interface EcosystemFissionVisual {
  phase: EcosystemFissionPhase;
  progress: number;
  parentOrigins: readonly Point[];
}

interface FissionState {
  elapsed: number;
  duration: number;
  sourcePopulation: 1 | 2;
  spawned: boolean;
  parentOrigins: Point[];
  axisAngle: number;
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
  private readonly adults: EcosystemAdult[];
  private bounds: WanderBounds;
  private quality: MascotQuality;
  private fry: EcosystemFry | null = null;
  private fission: FissionState | null = null;
  private pointer = { x: 0, y: 0, active: false };
  private simTime = 0;
  private spawnCooldown = 0;
  private assistSeconds = 0;
  private bloomSeconds = 0;
  private reducedMotion = false;
  private enabled = true;
  private lastStatusKey = "";
  private fryHideTarget: Point | null = null;
  private nextFryHideAt = 0;

  constructor(options: FishEcosystemOptions) {
    this.rng = new SeededRandom(options.seed + 0x5f3759df);
    this.createRuntime = options.createRuntime;
    this.onStatus = options.onStatus;
    this.getHideTargets = options.getHideTargets;
    this.bounds = options.bounds;
    this.quality = options.quality;
    this.adults = [
      {
        id: "signal-leader",
        role: "leader",
        runtime: options.leader,
        scale: 1,
        targetScale: 1,
        feedPulse: 0,
        preferredSide: 1,
        orbitSpeed: 0.38,
      },
    ];
    this.emitStatus(true);
  }

  getAdults(): readonly EcosystemAdult[] {
    return this.adults;
  }

  getFry(): EcosystemFry | null {
    return this.fry;
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
      parentOrigins: this.fission.parentOrigins,
    };
  }

  getStatus(): MascotEcosystemStatus {
    const canRelease =
      this.enabled &&
      this.spawnCooldown <= 0 &&
      !this.fry &&
      !this.fission &&
      !this.population.isFissionPending();
    const status = this.population.getStatus(canRelease);
    status.fissionPhase = this.getFissionVisual()?.phase ?? null;
    return status;
  }

  setPointer(x: number, y: number, active: boolean): void {
    if (Number.isFinite(x)) this.pointer.x = x;
    if (Number.isFinite(y)) this.pointer.y = y;
    this.pointer.active = active;
  }

  setScrollVelocity(value: number): void {
    for (const adult of this.adults) adult.runtime.setScrollVelocity(value);
  }

  setBounds(bounds: WanderBounds): void {
    this.bounds = bounds;
    for (const adult of this.adults) adult.runtime.setBounds(bounds);
    if (this.fry) {
      this.fry.x = clamp(this.fry.x, bounds.minX, bounds.maxX);
      this.fry.y = clamp(this.fry.y, bounds.minY, bounds.maxY);
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
      this.callFish();
      return;
    }

    if (action.type === "click") {
      this.adults[0].runtime.trigger(action);
      return;
    }
    for (const adult of this.adults) adult.runtime.trigger(action);
  }

  releaseFry(x?: number, y?: number): boolean {
    if (
      !this.enabled ||
      this.spawnCooldown > 0 ||
      !this.population.requestFry()
    ) {
      return false;
    }

    const spawnX = clamp(
      Number.isFinite(x)
        ? (x as number)
        : lerp(this.bounds.minX, this.bounds.maxX, 0.78),
      this.bounds.minX,
      this.bounds.maxX,
    );
    const spawnY = clamp(
      Number.isFinite(y)
        ? (y as number)
        : lerp(this.bounds.minY, this.bounds.maxY, 0.3),
      this.bounds.minY,
      this.bounds.maxY,
    );
    const heading = this.rng.angle();
    this.fry = {
      x: spawnX,
      y: spawnY,
      vx: Math.cos(heading) * 12,
      vy: Math.sin(heading) * 12,
      heading,
      age: 0,
      tailPhase: this.rng.angle(),
      color: this.rng.pick(["#ffb178", "#8fe9c9", "#cbb2ff", "#91d9dc"]),
    };
    this.spawnCooldown = 2;
    this.selectFryHideTarget();
    this.emitStatus();
    return true;
  }

  callFish(): void {
    if (!this.fry || this.fission) return;
    this.assistSeconds = 3.5;
  }

  update(dt: number): void {
    if (!this.enabled || !Number.isFinite(dt) || dt <= 0) return;
    this.simTime += dt;
    this.spawnCooldown = Math.max(0, this.spawnCooldown - dt);
    this.assistSeconds = Math.max(0, this.assistSeconds - dt);
    this.bloomSeconds = Math.max(0, this.bloomSeconds - dt);

    if (this.fission) this.updateFission(dt);
    this.routeAdultTargets();

    for (const adult of this.adults) {
      adult.feedPulse = Math.max(0, adult.feedPulse - dt * 1.8);
      adult.targetScale = this.resolveTargetScale(adult);
      adult.scale = lerp(adult.scale, adult.targetScale, clamp(dt * 4.2, 0, 1));
      adult.runtime.update(dt);
    }

    if (this.fry && !this.fission) {
      this.updateFry(dt, this.fry);
      this.checkFryCatch();
    }

    this.emitStatus();
  }

  private routeAdultTargets(): void {
    if (this.fission) {
      this.routeFissionTargets();
      return;
    }

    const leader = this.adults[0];
    if (this.fry && this.assistSeconds > 0) {
      leader.runtime.setPointer(this.fry.x, this.fry.y, true);
    } else {
      leader.runtime.setPointer(
        this.pointer.x,
        this.pointer.y,
        this.pointer.active,
      );
    }

    for (let index = 1; index < this.adults.length; index += 1) {
      const target = this.socialTarget(index);
      this.adults[index].runtime.setPointer(target.x, target.y, true);
    }
  }

  private socialTarget(index: number): Point {
    const leader = this.adults[0].runtime;
    const root = leader.pose.getRoot();
    const heading = leader.pose.getHeading();
    const forwardX = Math.cos(heading);
    const forwardY = Math.sin(heading);
    const normalX = -forwardY;
    const normalY = forwardX;
    const mode = Math.floor(this.simTime / 9) % 3;
    let target: Point;

    if (this.adults.length === 2) {
      const sway = Math.sin(this.simTime * 0.7) * 14;
      target = {
        x: root.x + normalX * 62 + forwardX * sway,
        y: root.y + normalY * 62 + forwardY * sway,
      };
    } else if (mode === 0) {
      const angle =
        this.simTime * this.adults[index].orbitSpeed +
        (index * Math.PI * 2) / this.adults.length;
      target = {
        x: root.x + Math.cos(angle) * 76,
        y: root.y + Math.sin(angle) * 58,
      };
    } else if (mode === 1) {
      const side = this.adults[index].preferredSide;
      target = {
        x: root.x - forwardX * (34 + index * 20) + normalX * side * 28,
        y: root.y - forwardY * (34 + index * 20) + normalY * side * 28,
      };
    } else {
      const lane = index - (this.adults.length - 1) / 2;
      target = {
        x: root.x + normalX * lane * 48 - forwardX * 18,
        y: root.y + normalY * lane * 48 - forwardY * 18,
      };
    }

    for (let otherIndex = 0; otherIndex < this.adults.length; otherIndex += 1) {
      if (otherIndex === index) continue;
      const other = this.adults[otherIndex].runtime.pose.getRoot();
      const own = this.adults[index].runtime.pose.getRoot();
      const dx = own.x - other.x;
      const dy = own.y - other.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      if (distance < 48) {
        const push = (48 - distance) * 1.1;
        target.x += (dx / distance) * push;
        target.y += (dy / distance) * push;
      }
    }

    return {
      x: clamp(target.x, this.bounds.minX, this.bounds.maxX),
      y: clamp(target.y, this.bounds.minY, this.bounds.maxY),
    };
  }

  private updateFry(dt: number, fry: EcosystemFry): void {
    fry.age += dt;
    fry.tailPhase += dt * 8;
    if (fry.age >= this.nextFryHideAt) this.selectFryHideTarget();
    const fatigued = fry.age > 11 || this.assistSeconds > 0;
    const hideDistance = this.fryHideTarget
      ? Math.hypot(this.fryHideTarget.x - fry.x, this.fryHideTarget.y - fry.y)
      : Infinity;
    const tuckedAway = hideDistance < 24;
    const baseSpeed = this.reducedMotion
      ? 5
      : tuckedAway
        ? 7
        : fatigued
          ? 18
          : 28;
    const wanderAngle =
      fry.heading + Math.sin(fry.age * 1.7 + fry.tailPhase) * 0.9;
    let desiredX = Math.cos(wanderAngle) * baseSpeed;
    let desiredY = Math.sin(wanderAngle) * baseSpeed;

    if (this.fryHideTarget && hideDistance > 12) {
      desiredX += ((this.fryHideTarget.x - fry.x) / hideDistance) * 19;
      desiredY += ((this.fryHideTarget.y - fry.y) / hideDistance) * 19;
    }

    for (const adult of this.adults) {
      const root = adult.runtime.pose.getRoot();
      const dx = fry.x - root.x;
      const dy = fry.y - root.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      if (distance < FRY_FLEE_RADIUS) {
        const strength =
          (1 - distance / FRY_FLEE_RADIUS) *
          (this.reducedMotion ? 5 : fatigued ? 44 : 82);
        desiredX += (dx / distance) * strength;
        desiredY += (dy / distance) * strength;
      }
    }

    if (this.pointer.active && this.assistSeconds <= 0) {
      const dx = fry.x - this.pointer.x;
      const dy = fry.y - this.pointer.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      if (distance < POINTER_FLEE_RADIUS) {
        const strength = (1 - distance / POINTER_FLEE_RADIUS) * 34;
        desiredX += (dx / distance) * strength;
        desiredY += (dy / distance) * strength;
      }
    }

    const edge = 46;
    if (fry.x < this.bounds.minX + edge) desiredX += 55;
    if (fry.x > this.bounds.maxX - edge) desiredX -= 55;
    if (fry.y < this.bounds.minY + edge) desiredY += 55;
    if (fry.y > this.bounds.maxY - edge) desiredY -= 55;

    const maxSpeed = this.reducedMotion ? 8 : fatigued ? 54 : 92;
    const speed = Math.hypot(desiredX, desiredY);
    if (speed > maxSpeed) {
      desiredX = (desiredX / speed) * maxSpeed;
      desiredY = (desiredY / speed) * maxSpeed;
    }

    fry.vx = lerp(fry.vx, desiredX, clamp(dt * 3.2, 0, 1));
    fry.vy = lerp(fry.vy, desiredY, clamp(dt * 3.2, 0, 1));
    fry.x = clamp(fry.x + fry.vx * dt, this.bounds.minX, this.bounds.maxX);
    fry.y = clamp(fry.y + fry.vy * dt, this.bounds.minY, this.bounds.maxY);
    if (Math.hypot(fry.vx, fry.vy) > 1)
      fry.heading = Math.atan2(fry.vy, fry.vx);
  }

  private checkFryCatch(): void {
    if (!this.fry || this.fry.age < FRY_MIN_CATCH_AGE) return;
    for (const adult of this.adults) {
      const root = adult.runtime.pose.getRoot();
      if (
        Math.hypot(root.x - this.fry.x, root.y - this.fry.y) > FRY_CATCH_RADIUS
      ) {
        continue;
      }

      const caughtAt = { x: this.fry.x, y: this.fry.y };
      const outcome = this.population.consumeFry();
      this.fry = null;
      this.fryHideTarget = null;
      this.assistSeconds = 0;
      adult.feedPulse = 1;
      adult.runtime.trigger({ type: "click", x: caughtAt.x, y: caughtAt.y });

      if (outcome === "fission") this.beginFission();
      if (outcome === "bloom") {
        this.bloomSeconds = 1.25;
        for (const member of this.adults) member.feedPulse = 1;
      }
      this.emitStatus(true);
      return;
    }
  }

  private beginFission(): void {
    const sourcePopulation = this.population.getPopulation();
    if (sourcePopulation === 4) return;
    const parentOrigins = this.adults.map((adult) =>
      adult.runtime.pose.getRoot(),
    );
    const heading = this.adults[0].runtime.pose.getHeading();
    this.fission = {
      elapsed: 0,
      duration: this.reducedMotion
        ? REDUCED_FISSION_DURATION
        : FISSION_DURATION,
      sourcePopulation,
      spawned: false,
      parentOrigins,
      axisAngle: heading + Math.PI / 2,
    };
  }

  private selectFryHideTarget(): void {
    const candidates = this.getHideTargets?.() ?? [];
    this.fryHideTarget =
      candidates.length > 0 ? { ...this.rng.pick(candidates) } : null;
    this.nextFryHideAt = (this.fry?.age ?? 0) + this.rng.range(3.2, 5.4);
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
    const sourcePopulation = this.fission.sourcePopulation;
    const newPopulation = this.population.completeFission();
    const childScale = baseScaleForPopulation(newPopulation);

    for (let index = 0; index < sourcePopulation; index += 1) {
      const origin = this.fission.parentOrigins[index];
      const childIndex = this.adults.length;
      const runtime = this.createRuntime(
        Math.floor(this.rng.next() * 0x7fffffff),
        origin.x,
        origin.y,
        childIndex,
      );
      runtime.setQuality(this.quality);
      runtime.setEnabled(this.enabled);
      runtime.setReducedMotion(this.reducedMotion);
      runtime.setAppearancePreset(COMPANION_PRESETS[childIndex]);
      if (childIndex === 3) runtime.appearancePalette = MOONLIT_KOI_PALETTE;

      this.adults.push({
        id: `signal-sibling-${childIndex}`,
        role: "companion",
        runtime,
        scale: childScale,
        targetScale: childScale,
        feedPulse: 0,
        preferredSide: childIndex % 2 === 0 ? -1 : 1,
        orbitSpeed: 0.28 + this.rng.next() * 0.22,
      });
    }

    for (const adult of this.adults) {
      adult.scale = childScale;
      adult.targetScale = childScale;
      adult.feedPulse = 0;
    }
    this.emitStatus(true);
  }

  private routeFissionTargets(): void {
    if (!this.fission) return;
    const normalX = Math.cos(this.fission.axisAngle);
    const normalY = Math.sin(this.fission.axisAngle);
    const sourcePopulation = this.fission.sourcePopulation;
    const progress = clamp(this.fission.elapsed / this.fission.duration, 0, 1);
    const separation = progress < 0.52 ? 0 : ((progress - 0.52) / 0.48) * 58;

    for (let index = 0; index < this.adults.length; index += 1) {
      const parentIndex = index % sourcePopulation;
      const origin = this.fission.parentOrigins[parentIndex];
      const side = index < sourcePopulation ? -1 : 1;
      this.adults[index].runtime.setPointer(
        origin.x + normalX * separation * side,
        origin.y + normalY * separation * side,
        true,
      );
    }
  }

  private resolveTargetScale(adult: EcosystemAdult): number {
    const population = this.population.getPopulation();
    let scale = baseScaleForPopulation(population);
    const meals = this.population.getStageMeals();
    if (population === 1) scale += meals * 0.08;
    if (population === 2) scale += meals * 0.045;
    scale += adult.feedPulse * 0.045;
    scale += this.getBloomStrength() * 0.04;

    if (this.fission) {
      const progress = clamp(
        this.fission.elapsed / this.fission.duration,
        0,
        1,
      );
      if (!this.fission.spawned) scale += Math.sin(progress * Math.PI) * 0.12;
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

export function baseScaleForPopulation(population: 1 | 2 | 4): number {
  if (population === 1) return 1;
  if (population === 2) return 0.92;
  return 0.8;
}

function phaseForProgress(progress: number): EcosystemFissionPhase {
  if (progress < 0.18) return "settle";
  if (progress < 0.4) return "round";
  if (progress < 0.58) return "seam";
  if (progress < 0.84) return "separate";
  return "recover";
}
