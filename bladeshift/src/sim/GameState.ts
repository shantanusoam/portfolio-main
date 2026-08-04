export type GameMode = 'classic' | 'zen';

export interface FlyingEntity {
  id: number;
  defKey: string;
  isBomb: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  radius: number;
  points: number;
  sliced: boolean;
}

export interface Piece {
  id: number;
  defKey: string;
  half: 'a' | 'b';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  radius: number;
  age: number;
}

export const GRAVITY_FRACTION = 1.7; // px/s^2 per px of world height

let nextEntityId = 1;
let nextPieceId = 1;

export class GameState {
  mode: GameMode = 'classic';
  worldWidth = 1024;
  worldHeight = 768;

  entities: FlyingEntity[] = [];
  pieces: Piece[] = [];

  lives = 3;
  gameOver = false;
  elapsedMs = 0;

  resize(width: number, height: number): void {
    this.worldWidth = width;
    this.worldHeight = height;
  }

  reset(mode: GameMode): void {
    this.mode = mode;
    this.entities = [];
    this.pieces = [];
    this.lives = mode === 'classic' ? 3 : Infinity;
    this.gameOver = false;
    this.elapsedMs = 0;
  }

  get gravity(): number {
    return this.worldHeight * GRAVITY_FRACTION;
  }

  spawnEntity(params: {
    defKey: string;
    isBomb: boolean;
    x: number;
    peakHeightFrac: number;
    vx: number;
    radius: number;
    points: number;
    angularVelocity: number;
  }): FlyingEntity {
    const peakHeight = params.peakHeightFrac * this.worldHeight;
    const vy = -Math.sqrt(2 * this.gravity * Math.max(40, peakHeight));
    const entity: FlyingEntity = {
      id: nextEntityId++,
      defKey: params.defKey,
      isBomb: params.isBomb,
      x: params.x,
      y: this.worldHeight + params.radius + 20,
      vx: params.vx,
      vy,
      rotation: 0,
      angularVelocity: params.angularVelocity,
      radius: params.radius,
      points: params.points,
      sliced: false
    };
    this.entities.push(entity);
    return entity;
  }

  spawnPiece(params: {
    defKey: string;
    half: 'a' | 'b';
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    angularVelocity: number;
    radius: number;
  }): Piece {
    const piece: Piece = { id: nextPieceId++, age: 0, ...params };
    this.pieces.push(piece);
    return piece;
  }

  /** Advances ballistic motion. Returns fruits that fell off-screen unsliced this tick. */
  step(dtSeconds: number): { missed: FlyingEntity[] } {
    this.elapsedMs += dtSeconds * 1000;
    const g = this.gravity;
    const missed: FlyingEntity[] = [];
    const bottomBound = this.worldHeight + 120;

    for (const e of this.entities) {
      e.vy += g * dtSeconds;
      e.x += e.vx * dtSeconds;
      e.y += e.vy * dtSeconds;
      e.rotation += e.angularVelocity * dtSeconds;
    }
    this.entities = this.entities.filter((e) => {
      if (e.y - e.radius > bottomBound) {
        if (!e.sliced) missed.push(e);
        return false;
      }
      return true;
    });

    for (const p of this.pieces) {
      p.vy += g * dtSeconds;
      p.x += p.vx * dtSeconds;
      p.y += p.vy * dtSeconds;
      p.rotation += p.angularVelocity * dtSeconds;
      p.age += dtSeconds * 1000;
    }
    this.pieces = this.pieces.filter((p) => p.y - p.radius < bottomBound && p.age < 4000);

    return { missed };
  }

  removeEntity(id: number): void {
    this.entities = this.entities.filter((e) => e.id !== id);
  }
}
