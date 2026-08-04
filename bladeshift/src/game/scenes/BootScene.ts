import Phaser from 'phaser';
import { FRUIT_TYPES } from '../../sim/FruitTypes';

export const TEXTURE = {
  fruit: (key: string) => `fruit-${key}`,
  fruitHalf: (key: string, half: 'a' | 'b') => `fruit-${key}-${half}`,
  bomb: 'bomb',
  bombHalf: (half: 'a' | 'b') => `bomb-${half}`,
  particle: 'particle-dot',
  background: 'bg-gradient'
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    for (const def of FRUIT_TYPES) {
      this.buildWholeCircle(TEXTURE.fruit(def.key), def.radius, def.rindColor);
      this.buildHalfTexture(TEXTURE.fruitHalf(def.key, 'a'), def.radius, def.fleshColor, def.rindColor, 'a');
      this.buildHalfTexture(TEXTURE.fruitHalf(def.key, 'b'), def.radius, def.fleshColor, def.rindColor, 'b');
    }

    this.buildBomb();
    this.buildParticleDot();
    this.buildBackground();

    this.game.events.emit('boot:ready');
  }

  private buildWholeCircle(key: string, radius: number, color: number): void {
    const gfx = this.add.graphics();
    const size = radius * 2 + 4;
    const c = size / 2;
    gfx.fillStyle(0x000000, 0.18);
    gfx.fillEllipse(c, c + radius * 0.15, radius * 1.7, radius * 0.5);
    gfx.fillStyle(color, 1);
    gfx.fillCircle(c, c, radius);
    gfx.fillStyle(0xffffff, 0.25);
    gfx.fillEllipse(c - radius * 0.35, c - radius * 0.35, radius * 0.7, radius * 0.4);
    gfx.lineStyle(2, 0x000000, 0.15);
    gfx.strokeCircle(c, c, radius);
    gfx.generateTexture(key, size, size);
    gfx.destroy();
  }

  private buildHalfTexture(key: string, radius: number, fleshColor: number, rindColor: number, half: 'a' | 'b'): void {
    const size = radius * 2;
    const c = size / 2;
    const gfx = this.add.graphics();

    const start = half === 'a' ? 0 : Math.PI;
    const end = half === 'a' ? Math.PI : Math.PI * 2;

    gfx.fillStyle(fleshColor, 1);
    gfx.slice(c, c, radius, start, end, false);
    gfx.fillPath();

    gfx.lineStyle(5, rindColor, 1);
    gfx.beginPath();
    gfx.arc(c, c, radius - 2, start, end, false);
    gfx.strokePath();

    gfx.lineStyle(2, 0xffffff, 0.5);
    gfx.beginPath();
    gfx.moveTo(c - radius, c);
    gfx.lineTo(c + radius, c);
    gfx.strokePath();

    gfx.generateTexture(key, size, size);
    gfx.destroy();
  }

  private buildBomb(): void {
    const radius = 32;
    const size = radius * 2 + 4;
    const c = size / 2;
    const gfx = this.add.graphics();
    gfx.fillStyle(0x000000, 0.2);
    gfx.fillEllipse(c, c + radius * 0.15, radius * 1.7, radius * 0.5);
    gfx.fillStyle(0x1c1c22, 1);
    gfx.fillCircle(c, c, radius);
    gfx.fillStyle(0xffffff, 0.15);
    gfx.fillEllipse(c - radius * 0.3, c - radius * 0.3, radius * 0.6, radius * 0.35);
    gfx.lineStyle(3, 0xff3b3b, 0.9);
    gfx.strokeCircle(c, c, radius * 0.62);
    gfx.fillStyle(0xff3b3b, 1);
    gfx.fillCircle(c, c - radius - 4, 4);
    gfx.generateTexture(TEXTURE.bomb, size, size);
    gfx.destroy();

    for (const half of ['a', 'b'] as const) {
      const start = half === 'a' ? 0 : Math.PI;
      const end = half === 'a' ? Math.PI : Math.PI * 2;
      const g2 = this.add.graphics();
      g2.fillStyle(0x2a2a32, 1);
      g2.slice(radius, radius, radius, start, end, false);
      g2.fillPath();
      g2.lineStyle(3, 0xff3b3b, 0.8);
      g2.beginPath();
      g2.arc(radius, radius, radius - 2, start, end, false);
      g2.strokePath();
      g2.generateTexture(TEXTURE.bombHalf(half), radius * 2, radius * 2);
      g2.destroy();
    }
  }

  private buildParticleDot(): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(8, 8, 7);
    gfx.generateTexture(TEXTURE.particle, 16, 16);
    gfx.destroy();
  }

  private buildBackground(): void {
    const w = Math.max(this.scale.width, 1);
    const h = Math.max(this.scale.height, 1);
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x14141f, 0x14141f, 0x1f1430, 0x090912, 1, 1, 1, 1);
    gfx.fillRect(0, 0, w, h);
    gfx.generateTexture(TEXTURE.background, w, h);
    gfx.destroy();
  }
}
