/** Screen-space physics. No DOM, React, or renderer dependencies. */
export interface Ledge {
  id: string;
  x: number;
  y: number;
  width: number;
  goal: boolean;
}

export interface SpringPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const point = (x: number, y: number): SpringPoint => ({ x, y, vx: 0, vy: 0 });
const smooth = (t: number) => t * t * (3 - 2 * t);

function spring(
  p: SpringPoint,
  x: number,
  y: number,
  dt: number,
  stiffness = 210,
) {
  p.vx += ((x - p.x) * stiffness - p.vx * 23) * dt;
  p.vy += ((y - p.y) * stiffness - p.vy * 23) * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
}

export class Limb {
  readonly index: number;
  readonly offset: number;
  readonly points = Array.from({ length: 9 }, () => point(0, 0));
  foot = point(0, 0);
  stepFromX = 0;
  stepToX = 0;
  stepTime = 1;
  cooldown = 0;
  constructor(index: number, offset: number) {
    this.index = index;
    this.offset = offset;
  }
}

export class HomeOctocatMotion {
  x = 0;
  y = 0;
  previousX = 0;
  previousY = 0;
  vx = 0;
  vy = 0;
  time = 0;
  gait = 0;
  grounded = true;
  ledgeId = "";
  playing = false;
  dragging = false;
  reducedMotion = false;
  axis = 0;
  jumpHeld = false;
  lookX = 0;
  lookY = 0;
  squash = 0;
  squashVelocity = 0;
  turn = 0;
  head = point(0, 0);
  limbs = [-18, -6, 7, 19, -1, 1, -1].map(
    (offset, index) => new Limb(index, offset),
  );

  readonly visited = new Set<string>();
  surfaces: Ledge[] = [];
  width = 1280;
  height = 800;
  private initialized = false;
  private coyote = 0;
  private jumpBuffer = 0;
  private windup = 0;
  private jumpCut = false;
  private dragX = 0;
  private dragY = 0;
  private scrollY = 0;
  private patrolOrigin = 0;

  get state() {
    if (this.dragging) return "dragging";
    if (this.windup > 0) return "crouching";
    if (!this.grounded) return this.vy < 0 ? "jumping" : "falling";
    return Math.abs(this.vx) > 10 ? "walking" : "idle";
  }

  setLayout(surfaces: Ledge[], width: number, height: number, scrollY: number) {
    const oldLedge = this.surfaces.find((s) => s.id === this.ledgeId);
    const nextLedge = surfaces.find((s) => s.id === this.ledgeId);
    const dy =
      this.grounded && oldLedge && nextLedge
        ? nextLedge.y - oldLedge.y
        : this.scrollY - scrollY;
    this.surfaces = surfaces;
    this.width = width;
    this.height = height;
    this.scrollY = scrollY;
    if (!this.initialized) {
      if (surfaces.length) this.reset();
      return;
    }
    this.translate(0, dy);
    // Reflow can move a ledge horizontally as well as vertically.
    if (this.grounded && nextLedge) {
      this.translate(
        clamp(this.x, nextLedge.x + 12, nextLedge.x + nextLedge.width - 12) -
          this.x,
        0,
      );
      this.patrolOrigin = this.x;
    } else if (this.grounded && !nextLedge) {
      this.grounded = false;
    }
  }

  reset(clearScore = true) {
    const perch =
      this.surfaces.find((s) => s.id === "instrument") ?? this.surfaces[0];
    if (!perch) return;
    this.x = clamp(perch.x + perch.width * 0.91, 30, this.width - 30);
    this.y = perch.y;
    this.previousX = this.x;
    this.previousY = this.y;
    this.vx = this.vy = this.axis = this.windup = this.jumpBuffer = 0;
    this.squash = this.squashVelocity = 0;
    this.coyote = 0.1;
    this.jumpHeld = this.jumpCut = this.dragging = false;
    this.grounded = true;
    this.ledgeId = perch.id;
    this.patrolOrigin = this.x;
    this.head = point(this.x, this.y - 53);
    this.initialized = true;
    if (clearScore) this.visited.clear();
    for (const limb of this.limbs) {
      limb.foot = point(this.x + limb.offset, this.y);
      limb.stepTime = 1;
      limb.cooldown = 0;
      limb.points.forEach((p, i) => {
        p.x = this.x + (limb.offset * i) / 8;
        p.y = this.y - 28 + i * 3.5;
        p.vx = p.vy = 0;
      });
    }
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this.reset();
  }

  stop() {
    this.playing = false;
    this.reset();
  }

  clearInput() {
    this.axis = 0;
    this.jumpHeld = false;
    this.jumpBuffer = 0;
    if (this.dragging) this.release();
  }

  jump() {
    if (!this.playing || this.dragging) return;
    this.jumpBuffer = 0.14;
    this.jumpHeld = true;
  }

  grab(x: number, y: number) {
    this.dragging = true;
    this.grounded = false;
    this.windup = this.jumpBuffer = 0;
    this.dragTo(x, y);
  }

  dragTo(x: number, y: number) {
    this.dragX = clamp(x, 30, this.width - 30);
    this.dragY = clamp(y + 52, 85, this.height - 8);
  }

  release() {
    this.dragging = false;
    this.vx = clamp(this.vx, -620, 620);
    this.vy = clamp(this.vy, -760, 650);
    this.jumpCut = true;
  }

  private translate(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    this.previousX += dx;
    this.previousY += dy;
    this.head.x += dx;
    this.head.y += dy;
    for (const limb of this.limbs) {
      limb.foot.x += dx;
      limb.foot.y += dy;
      limb.stepFromX += dx;
      limb.stepToX += dx;
      for (const p of limb.points) {
        p.x += dx;
        p.y += dy;
      }
    }
  }

  update(dt: number) {
    if (!this.initialized) return;
    this.time += dt;
    this.previousX = this.x;
    this.previousY = this.y;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = this.grounded ? 0.1 : Math.max(0, this.coyote - dt);

    if (this.dragging) {
      this.vx += ((this.dragX - this.x) * 125 - this.vx * 16) * dt;
      this.vy += ((this.dragY - this.y) * 125 - this.vy * 16) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else {
      let axis = this.axis;
      if (!this.playing) {
        const ledge = this.surfaces.find((s) => s.id === this.ledgeId);
        const target = ledge
          ? clamp(
              this.patrolOrigin + Math.sin(this.time * 0.36) * 45,
              ledge.x + 34,
              ledge.x + ledge.width - 34,
            )
          : this.patrolOrigin;
        axis =
          this.reducedMotion || !ledge
            ? 0
            : clamp((target - this.x) / 45, -0.23, 0.23);
      }
      const acceleration = this.grounded ? 14 : 6;
      this.vx += (axis * 245 - this.vx) * (1 - Math.exp(-acceleration * dt));
      this.x = clamp(this.x + this.vx * dt, 26, this.width - 26);
      if (this.x === 26 || this.x === this.width - 26) this.vx = 0;
      if (this.jumpBuffer > 0 && this.coyote > 0 && this.windup === 0) {
        this.windup = 0.075;
        this.jumpBuffer = this.coyote = 0;
      }
      if (this.windup > 0) {
        this.windup = Math.max(0, this.windup - dt);
        if (this.windup === 0) {
          this.vy = -750;
          this.grounded = false;
          this.coyote = 0;
          this.jumpCut = false;
          this.squashVelocity = -4;
        }
      }
      const support = this.surfaces.find((s) => s.id === this.ledgeId);
      if (
        this.grounded &&
        (!support ||
          this.x < support.x - 5 ||
          this.x > support.x + support.width + 5)
      ) {
        this.grounded = false;
      }
      if (!this.grounded) {
        if (!this.jumpHeld && !this.jumpCut && this.vy < -300) {
          this.vy *= 0.65;
          this.jumpCut = true;
        }
        this.vy = Math.min(960, this.vy + 1500 * dt);
        this.y += this.vy * dt;
        // Swept, one-way contacts: cross tops on descent, never teleport up.
        let landing: Ledge | undefined;
        if (this.vy >= 0) {
          for (const ledge of this.surfaces) {
            if (this.x < ledge.x - 4 || this.x > ledge.x + ledge.width + 4)
              continue;
            if (
              this.previousY <= ledge.y + 0.5 &&
              this.y >= ledge.y &&
              (!landing || ledge.y < landing.y)
            )
              landing = ledge;
          }
        }
        if (landing) {
          this.y = landing.y;
          this.squashVelocity = Math.min(6, this.vy / 140);
          this.vy = 0;
          this.grounded = true;
          this.ledgeId = landing.id;
          for (let i = 0; i < 4; i++) {
            const limb = this.limbs[i];
            limb.foot.x = this.x + limb.offset;
            limb.foot.y = this.y;
            limb.stepTime = 1;
          }
          if (this.playing && landing.goal) this.visited.add(landing.id);
        }
      }
    }

    if (this.y > this.height + 180 || this.y < -450) this.reset(false);
    this.gait += Math.abs(this.vx) * dt * 0.095;
    const squashTarget = this.reducedMotion
      ? 0
      : this.windup > 0
        ? 0.25
        : clamp(this.vy / 3000, -0.15, 0.08);
    this.squashVelocity +=
      ((squashTarget - this.squash) * 260 - this.squashVelocity * 19) * dt;
    this.squash += this.squashVelocity * dt;
    this.turn +=
      (clamp(this.vx / 220, -1, 1) * 0.7 +
        clamp((this.lookX - this.x) / 1000, -0.2, 0.2) -
        this.turn) *
      (1 - Math.exp(-10 * dt));
    const bob = this.reducedMotion
      ? 0
      : this.grounded
        ? Math.sin(this.gait * 2) * Math.min(1.8, Math.abs(this.vx) / 60) +
          Math.sin(this.time * 2.1) * 0.6
        : 0;
    spring(
      this.head,
      this.x + this.vx * 0.014,
      this.y - 53 + this.squash * 22 + bob,
      dt,
      340,
    );
    this.updateLimbs(dt);
  }

  private updateLimbs(dt: number) {
    const support = this.surfaces.find((s) => s.id === this.ledgeId);
    let stepping = 0;
    for (let i = 0; i < 4; i++) if (this.limbs[i].stepTime < 1) stepping++;
    for (const limb of this.limbs) {
      const i = limb.index;
      limb.cooldown = Math.max(0, limb.cooldown - dt);
      const arm = i >= 4 && i <= 5;
      const tail = i === 6;
      const side = limb.offset < 0 ? -1 : 1;
      const anchorX =
        this.x + (arm ? side * 7 : tail ? -5 : limb.offset * 0.36);
      const anchorY = this.y - 28 + this.squash * 12;
      let endX: number;
      let endY: number;
      if (!arm && !tail && this.grounded && support) {
        const desired = clamp(
          this.x + limb.offset + this.vx * 0.085,
          support.x + 2,
          support.x + support.width - 2,
        );
        if (
          limb.stepTime >= 1 &&
          limb.cooldown === 0 &&
          Math.abs(desired - limb.foot.x) > 14 &&
          stepping < 2
        ) {
          limb.stepFromX = limb.foot.x;
          limb.stepToX = desired;
          limb.stepTime = 0;
          stepping++;
        }
        if (limb.stepTime < 1) {
          limb.stepTime = Math.min(1, limb.stepTime + dt / 0.16);
          if (limb.stepTime === 1) limb.cooldown = 0.08;
          limb.foot.x =
            limb.stepFromX +
            (limb.stepToX - limb.stepFromX) * smooth(limb.stepTime);
          limb.foot.y = this.y - Math.sin(limb.stepTime * Math.PI) * 10;
        } else limb.foot.y = this.y;
        endX = limb.foot.x;
        endY = limb.foot.y;
      } else if (tail) {
        endX = this.x - 36 - this.vx * 0.065;
        endY =
          this.y -
          25 +
          (this.reducedMotion ? 0 : Math.sin(this.time * 2.7) * 5);
      } else if (arm) {
        endX =
          this.x +
          side * (30 + Math.min(15, Math.abs(this.vy) * 0.025)) -
          this.vx * 0.07;
        endY =
          this.y -
          29 -
          this.vy * 0.026 +
          (this.reducedMotion
            ? 0
            : Math.sin(this.gait + i * Math.PI) *
              Math.min(7, Math.abs(this.vx) * 0.04));
      } else {
        endX = this.x + limb.offset * 1.3 - this.vx * (0.055 + i * 0.006);
        endY =
          this.y -
          Math.min(18, Math.abs(this.vy) * 0.018) +
          Math.sin(this.time * 4 + i) * 3;
        limb.foot.x = endX;
        limb.foot.y = endY;
        limb.stepTime = 1;
      }
      for (let j = 0; j < limb.points.length; j++) {
        const t = j / (limb.points.length - 1);
        const bend = Math.sin(t * Math.PI);
        const x =
          anchorX +
          (endX - anchorX) * t +
          bend * (tail ? -20 : side * 5 - this.vx * 0.016);
        const y =
          anchorY + (endY - anchorY) * t + bend * (tail ? 22 : arm ? 9 : -5);
        const p = limb.points[j];
        if (j === 0) {
          p.x = x;
          p.y = y;
        } else if (j === 8 && !arm && !tail && this.grounded) {
          p.x = x;
          p.y = y;
          p.vx = p.vy = 0;
        } else spring(p, x, y, dt, this.reducedMotion ? 340 : 230 - j * 9);
      }
    }
  }
}
