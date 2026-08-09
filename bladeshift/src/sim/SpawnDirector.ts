import { FRUIT_TYPES } from './FruitTypes';
import type { SeededRandom } from './rng';

export interface SpawnRequest {
  defKey: string;
  isBomb: boolean;
  x: number;
  peakHeightFrac: number;
  vx: number;
  radius: number;
  points: number;
  angularVelocity: number;
}

const BASE_INTERVAL_MS = 1400;
const MIN_INTERVAL_MS = 550;
const DIFFICULTY_RAMP_MS = 45_000; // time to reach minimum interval

export class SpawnDirector {
  private rng: SeededRandom;
  private allowBombs: boolean;
  private timeSinceLastSpawn = 0;
  private nextInterval: number;

  constructor(rng: SeededRandom, allowBombs: boolean) {
    this.rng = rng;
    this.allowBombs = allowBombs;
    this.nextInterval = BASE_INTERVAL_MS;
  }

  update(dtMs: number, elapsedMs: number): SpawnRequest[] {
    this.timeSinceLastSpawn += dtMs;
    if (this.timeSinceLastSpawn < this.nextInterval) return [];

    this.timeSinceLastSpawn = 0;
    const rampT = Math.min(1, elapsedMs / DIFFICULTY_RAMP_MS);
    const interval = BASE_INTERVAL_MS - (BASE_INTERVAL_MS - MIN_INTERVAL_MS) * rampT;
    this.nextInterval = interval * this.rng.range(0.85, 1.2);

    const burstRoll = this.rng.next();
    const burstSize = burstRoll < 0.15 + rampT * 0.25 ? (this.rng.chance(0.3) ? 3 : 2) : 1;

    const requests: SpawnRequest[] = [];
    for (let i = 0; i < burstSize; i++) {
      requests.push(this.makeOne(rampT, burstSize, i));
    }
    return requests;
  }

  private makeOne(rampT: number, burstSize: number, indexInBurst: number): SpawnRequest {
    const bombProbability = this.allowBombs ? 0.08 + rampT * 0.1 : 0;
    const isBomb = this.allowBombs && burstSize === 1 && this.rng.chance(bombProbability);

    // Spread multi-fruit bursts across lanes so there's always a clean path between them.
    const lane = burstSize > 1 ? (indexInBurst + 0.5) / burstSize : this.rng.range(0.15, 0.85);
    const x = (lane * 0.7 + 0.15) * 1; // caller multiplies by worldWidth

    if (isBomb) {
      return {
        defKey: 'bomb',
        isBomb: true,
        x,
        peakHeightFrac: this.rng.range(0.5, 0.75),
        vx: this.rng.range(-0.12, 0.12),
        radius: 32,
        points: 0,
        angularVelocity: this.rng.range(-2, 2)
      };
    }

    const def = this.rng.pick(FRUIT_TYPES);
    return {
      defKey: def.key,
      isBomb: false,
      x,
      peakHeightFrac: this.rng.range(0.55, 0.85),
      vx: this.rng.range(-0.15, 0.15),
      radius: def.radius,
      points: def.points,
      angularVelocity: this.rng.range(-3, 3)
    };
  }
}
