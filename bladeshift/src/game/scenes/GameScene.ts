import Phaser from 'phaser';
import type { AudioDirector } from '../../audio/AudioDirector';
import type { InputRouter } from '../../input/InputRouter';
import { fruitByKey } from '../../sim/FruitTypes';
import type { GameMode } from '../../sim/GameState';
import { GameSimulation } from '../../sim/GameSimulation';
import { createSeed } from '../../sim/rng';
import { BladeTrail } from '../effects/BladeTrail';
import { JuiceParticles } from '../effects/JuiceParticles';
import { TEXTURE } from './BootScene';

export interface GameSceneData {
  mode: GameMode;
  seed?: number;
}

function syncMap<T extends { id: number }>(
  map: Map<number, Phaser.GameObjects.Image>,
  list: readonly T[],
  create: (item: T) => Phaser.GameObjects.Image,
  apply: (img: Phaser.GameObjects.Image, item: T) => void
): void {
  const seen = new Set<number>();
  for (const item of list) {
    seen.add(item.id);
    let img = map.get(item.id);
    if (!img) {
      img = create(item);
      map.set(item.id, img);
    }
    apply(img, item);
  }
  for (const [id, img] of map) {
    if (!seen.has(id)) {
      img.destroy();
      map.delete(id);
    }
  }
}

export class GameScene extends Phaser.Scene {
  private sim!: GameSimulation;
  private router!: InputRouter;
  private audio!: AudioDirector;

  private entitySprites = new Map<number, Phaser.GameObjects.Image>();
  private pieceSprites = new Map<number, Phaser.GameObjects.Image>();
  private bladeTrail!: BladeTrail;
  private juice!: JuiceParticles;
  private background!: Phaser.GameObjects.Graphics;
  private hitStopMs = 0;
  private mode: GameMode = 'classic';

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.mode = data.mode;
    this.hitStopMs = 0;
    this.entitySprites = new Map();
    this.pieceSprites = new Map();
  }

  create(data: GameSceneData): void {
    this.router = this.game.registry.get('inputRouter') as InputRouter;
    this.audio = this.game.registry.get('audio') as AudioDirector;

    this.background = this.add.graphics().setDepth(-10);
    this.drawBackground();
    this.scale.on('resize', this.onResize, this);

    const seed = data.seed ?? createSeed();
    this.sim = new GameSimulation(seed, data.mode, this.scale.width, this.scale.height);

    this.bladeTrail = new BladeTrail(this, 50);
    this.juice = new JuiceParticles(this, 40);

    this.sim.events.on('sliced', ({ entity, bladeAngle, gained, combo, comboBroken }) => {
      const def = fruitByKey(entity.defKey);
      this.juice.burst(entity.x, entity.y, bladeAngle, def.fleshColor, 16);
      this.audio.playSlice(combo);
      this.hitStopMs = 40;
      if (combo > 1 && combo % 5 === 0) {
        this.cameras.main.flash(140, 255, 255, 255);
      }
      this.game.events.emit('hud:score', {
        score: this.sim.score.score,
        gained,
        combo,
        comboBroken,
        lives: this.sim.state.lives
      });
    });

    this.sim.events.on('bombSliced', ({ entity }) => {
      this.juice.burst(entity.x, entity.y, 0, 0xff5a3d, 22);
      this.audio.playBomb();
      this.cameras.main.shake(260, 0.02);
      this.cameras.main.flash(220, 255, 70, 40);
      this.hitStopMs = 90;
    });

    this.sim.events.on('missed', ({ livesRemaining }) => {
      if (this.mode === 'classic') {
        this.audio.playMiss();
        this.cameras.main.shake(90, 0.006);
        this.game.events.emit('hud:lives', { lives: livesRemaining });
      }
    });

    this.sim.events.on('gameOver', ({ score, bestCombo }) => {
      this.audio.playGameOver();
      this.game.events.emit('hud:gameover', { score, bestCombo });
    });

    this.sim.events.on('bladeMove', ({ id, x, y }) => this.bladeTrail.push(id, x, y));
    this.sim.events.on('bladeEnd', ({ id }) => this.bladeTrail.end(id));

    this.game.events.emit('hud:ready', { mode: data.mode, lives: this.sim.state.lives, seed });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onResize, this);
      this.bladeTrail.destroy();
      this.juice.destroy();
    });
  }

  update(time: number, delta: number): void {
    let dtSeconds = Math.min(0.033, delta / 1000);
    if (this.hitStopMs > 0) {
      this.hitStopMs -= delta;
      dtSeconds *= 0.06;
    }

    const frame = this.router.update(time);
    this.sim.update(dtSeconds, time, frame);

    syncMap(
      this.entitySprites,
      this.sim.state.entities,
      (e) => this.add.image(e.x, e.y, e.isBomb ? TEXTURE.bomb : TEXTURE.fruit(e.defKey)).setDepth(20),
      (img, e) => img.setPosition(e.x, e.y).setRotation(e.rotation)
    );

    syncMap(
      this.pieceSprites,
      this.sim.state.pieces,
      (p) => this.add.image(p.x, p.y, TEXTURE.fruitHalf(p.defKey, p.half)).setDepth(15),
      (img, p) => {
        img.setPosition(p.x, p.y).setRotation(p.rotation);
        img.setAlpha(Phaser.Math.Clamp(1 - Math.max(0, p.age - 2600) / 1000, 0, 1));
      }
    );

    this.bladeTrail.render(time);
  }

  private drawBackground(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    this.background.clear();
    this.background.fillGradientStyle(0x181826, 0x181826, 0x241a38, 0x0b0b13, 1, 1, 1, 1);
    this.background.fillRect(0, 0, w, h);
  }

  private onResize(size: Phaser.Structs.Size): void {
    this.sim.resize(size.width, size.height);
    this.drawBackground();
  }
}
