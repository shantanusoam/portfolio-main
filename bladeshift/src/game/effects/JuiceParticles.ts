import Phaser from 'phaser';
import { TEXTURE } from '../scenes/BootScene';

export class JuiceParticles {
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, depth: number) {
    this.emitter = scene.add.particles(0, 0, TEXTURE.particle, {
      lifespan: { min: 350, max: 700 },
      speed: { min: 120, max: 420 },
      scale: { start: 1, end: 0.1 },
      alpha: { start: 1, end: 0 },
      gravityY: 900,
      quantity: 0,
      emitting: false
    });
    this.emitter.setDepth(depth);
  }

  burst(x: number, y: number, angle: number, color: number, count = 14): void {
    this.emitter.setParticleTint(color);
    this.emitter.setEmitterAngle({ min: Phaser.Math.RadToDeg(angle) - 45, max: Phaser.Math.RadToDeg(angle) + 45 });
    this.emitter.explode(count, x, y);
  }

  destroy(): void {
    this.emitter.destroy();
  }
}
