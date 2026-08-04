import Phaser from 'phaser';

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

const MAX_AGE_MS = 160;
const MAX_POINTS = 24;

/** Per-pointer fading trail. Width/brightness react to recent travel speed. */
class Trail {
  points: TrailPoint[] = [];
}

export class BladeTrail {
  private scene: Phaser.Scene;
  private gfx: Phaser.GameObjects.Graphics;
  private trails = new Map<string, Trail>();

  constructor(scene: Phaser.Scene, depth: number) {
    this.scene = scene;
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(depth);
  }

  push(id: string, x: number, y: number): void {
    let trail = this.trails.get(id);
    if (!trail) {
      trail = new Trail();
      this.trails.set(id, trail);
    }
    trail.points.push({ x, y, t: this.scene.time.now });
    if (trail.points.length > MAX_POINTS) trail.points.shift();
  }

  end(id: string): void {
    this.trails.delete(id);
  }

  render(now: number): void {
    this.gfx.clear();

    for (const trail of this.trails.values()) {
      trail.points = trail.points.filter((p) => now - p.t < MAX_AGE_MS);
      const pts = trail.points;
      if (pts.length < 2) continue;

      let maxSpeed = 0;
      for (let i = 1; i < pts.length; i++) {
        const dt = Math.max(1, pts[i].t - pts[i - 1].t);
        const dist = Phaser.Math.Distance.Between(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        maxSpeed = Math.max(maxSpeed, dist / dt);
      }
      const intensity = Phaser.Math.Clamp(maxSpeed / 1.6, 0.25, 1);

      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const age = (now - b.t) / MAX_AGE_MS;
        const alpha = (1 - age) * intensity;
        if (alpha <= 0) continue;
        const width = Phaser.Math.Linear(2, 10, intensity) * (1 - age * 0.4);

        this.gfx.lineStyle(width, 0xffffff, alpha * 0.9);
        this.gfx.lineBetween(a.x, a.y, b.x, b.y);
        this.gfx.lineStyle(width * 2.2, 0x8fd3ff, alpha * 0.25);
        this.gfx.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
  }

  destroy(): void {
    this.gfx.destroy();
    this.trails.clear();
  }
}
