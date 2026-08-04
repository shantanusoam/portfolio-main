import type { BladeFrame, BladePointer } from '../input/InputAdapter';
import { EventBus } from './EventBus';
import { fruitByKey } from './FruitTypes';
import { GameState, type FlyingEntity, type GameMode, type Piece } from './GameState';
import { SeededRandom } from './rng';
import { SpawnDirector } from './SpawnDirector';
import { ScoreSystem } from './ScoreSystem';
import { SliceSystem } from './SliceSystem';

const SEPARATION_FORCE = 240;
const POP_IMPULSE = -70;

export type SimEvents = {
  spawn: { entity: FlyingEntity };
  sliced: {
    entity: FlyingEntity;
    pieces: [Piece, Piece];
    bladeAngle: number;
    bladeSpeed: number;
    gained: number;
    combo: number;
    comboBroken: boolean;
  };
  bombSliced: { entity: FlyingEntity };
  missed: { entity: FlyingEntity; livesRemaining: number };
  gameOver: { score: number; bestCombo: number };
  bladeMove: { id: string; x: number; y: number; source: BladePointer['source'] };
  bladeEnd: { id: string };
};

interface LastPoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
  timestamp: number;
}

export class GameSimulation {
  readonly events = new EventBus<SimEvents>();
  readonly state = new GameState();
  readonly score = new ScoreSystem();

  private rng: SeededRandom;
  private spawnDirector: SpawnDirector;
  private sliceSystem = new SliceSystem();
  private lastPoints = new Map<string, LastPoint>();
  private slicedThisFrame = new Set<number>();
  private seed: number;

  constructor(seed: number, mode: GameMode, width: number, height: number) {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
    this.spawnDirector = new SpawnDirector(this.rng, mode === 'classic');
    this.state.resize(width, height);
    this.state.reset(mode);
  }

  getSeed(): number {
    return this.seed;
  }

  resize(width: number, height: number): void {
    this.state.resize(width, height);
  }

  update(dtSeconds: number, timestamp: number, frame: BladeFrame): void {
    if (this.state.gameOver) return;

    this.slicedThisFrame.clear();
    this.processInput(timestamp, frame);

    for (const request of this.spawnDirector.update(dtSeconds * 1000, this.state.elapsedMs)) {
      const entity = this.state.spawnEntity({
        defKey: request.defKey,
        isBomb: request.isBomb,
        x: request.x * this.state.worldWidth,
        peakHeightFrac: request.peakHeightFrac,
        vx: request.vx * this.state.worldWidth,
        radius: request.radius,
        points: request.points,
        angularVelocity: request.angularVelocity
      });
      this.events.emit('spawn', { entity });
    }

    const { missed } = this.state.step(dtSeconds);
    for (const entity of missed) {
      if (entity.isBomb) continue;
      if (this.state.mode === 'classic') {
        this.state.lives -= 1;
        this.events.emit('missed', { entity, livesRemaining: this.state.lives });
        if (this.state.lives <= 0) this.endGame();
      } else {
        this.events.emit('missed', { entity, livesRemaining: Infinity });
      }
    }
  }

  private processInput(timestamp: number, frame: BladeFrame): void {
    for (const pointer of frame.pointers) {
      if (pointer.phase === 'end' || pointer.phase === 'cancel') {
        this.lastPoints.delete(pointer.id);
        this.events.emit('bladeEnd', { id: pointer.id });
        continue;
      }

      const wx = pointer.x * this.state.worldWidth;
      const wy = pointer.y * this.state.worldHeight;
      this.events.emit('bladeMove', { id: pointer.id, x: wx, y: wy, source: pointer.source });

      // Use the pointer sample's own timestamp, not the outer frame timestamp:
      // a single animation frame can carry several buffered/coalesced samples
      // for the same pointer, and they'd otherwise all share one timestamp,
      // making every dt after the first compute as zero and get skipped.
      const sampleTime = pointer.timestamp;

      if (pointer.phase === 'start') {
        this.lastPoints.set(pointer.id, { x: wx, y: wy, nx: pointer.x, ny: pointer.y, timestamp: sampleTime });
        continue;
      }

      const last = this.lastPoints.get(pointer.id);
      this.lastPoints.set(pointer.id, { x: wx, y: wy, nx: pointer.x, ny: pointer.y, timestamp: sampleTime });
      if (!last) continue;

      const dt = (sampleTime - last.timestamp) / 1000;
      if (dt <= 0) continue;

      const normSpeed = Math.hypot(pointer.x - last.nx, pointer.y - last.ny) / dt;
      if (!this.sliceSystem.meetsMinimumSpeed(normSpeed)) continue;

      const hits = this.sliceSystem.testSegment(
        { x1: last.x, y1: last.y, x2: wx, y2: wy, dtSeconds: dt },
        this.state.entities
      );

      for (const hit of hits) {
        if (this.slicedThisFrame.has(hit.entity.id)) continue;
        this.slicedThisFrame.add(hit.entity.id);
        this.applySlice(hit.entity, hit.normal, hit.bladeAngle, hit.bladeSpeed, timestamp);
        if (this.state.gameOver) return;
      }
    }
  }

  private applySlice(
    entity: FlyingEntity,
    normal: { x: number; y: number },
    bladeAngle: number,
    bladeSpeed: number,
    timestamp: number
  ): void {
    entity.sliced = true;
    this.state.removeEntity(entity.id);

    if (entity.isBomb) {
      this.events.emit('bombSliced', { entity });
      if (this.state.mode === 'classic') this.endGame();
      return;
    }

    const def = fruitByKey(entity.defKey);
    const offset = entity.radius * 0.28;
    const pieceA = this.state.spawnPiece({
      defKey: entity.defKey,
      half: 'a',
      x: entity.x + normal.x * offset,
      y: entity.y + normal.y * offset,
      vx: entity.vx + normal.x * SEPARATION_FORCE,
      vy: entity.vy + normal.y * SEPARATION_FORCE + POP_IMPULSE,
      rotation: entity.rotation,
      angularVelocity: entity.angularVelocity * 1.4 + 2,
      radius: entity.radius
    });
    const pieceB = this.state.spawnPiece({
      defKey: entity.defKey,
      half: 'b',
      x: entity.x - normal.x * offset,
      y: entity.y - normal.y * offset,
      vx: entity.vx - normal.x * SEPARATION_FORCE,
      vy: entity.vy - normal.y * SEPARATION_FORCE + POP_IMPULSE,
      rotation: entity.rotation + Math.PI,
      angularVelocity: entity.angularVelocity * 1.4 - 2,
      radius: entity.radius
    });

    const { gained, combo, comboBroken } = this.score.registerSlice(def.points, timestamp);
    this.events.emit('sliced', { entity, pieces: [pieceA, pieceB], bladeAngle, bladeSpeed, gained, combo, comboBroken });
  }

  private endGame(): void {
    this.state.gameOver = true;
    this.events.emit('gameOver', { score: this.score.score, bestCombo: this.score.bestCombo });
  }
}
