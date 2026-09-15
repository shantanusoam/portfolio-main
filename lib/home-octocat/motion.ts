/** Mochi's world uses pixels, positive Y down. The body is one connected mass. */
export interface Ledge {
  id: string;
  x: number;
  y: number;
  width: number;
  goal: boolean;
}
export type PlatformKind = "normal" | "spring" | "moving" | "crumble";
export interface Platform {
  id: number;
  x: number;
  baseX: number;
  y: number;
  width: number;
  kind: PlatformKind;
  hit: number;
  broken: boolean;
  star: boolean;
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  gold: boolean;
}
export type GamePhase = "idle" | "ready" | "climbing" | "over";
export type MotionEvent = "hop" | "spring" | "star" | "extra" | "over";
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export const GRAVITY = 1500;
export const HOP_SPEED = 650;
export const RUN_SPEED = 330;
const damp = (a: number, b: number, rate: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-rate * dt));
const noise = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Every consecutive platform is reachable with a normal bounce, without an extra hop. */
export function nextPlatform(
  previous: Platform,
  id: number,
  width: number,
): Platform {
  const difficulty = Math.min(1, id / 65);
  const size = Math.min(width * 0.42, 126 - difficulty * 34);
  const direction = Math.sin(id * 0.82) > 0 ? 1 : -1;
  const stride = id < 4 ? 30 + id * 8 : 70 + noise(id) * 58;
  const center = clamp(
    previous.baseX + previous.width / 2 + direction * stride,
    size / 2 + 30,
    width - size / 2 - 30,
  );
  const kind: PlatformKind =
    id % 6 === 5
      ? "spring"
      : id > 9 && id % 7 === 0
        ? "crumble"
        : id > 6 && id % 5 === 0
          ? "moving"
          : "normal";
  return {
    id,
    x: center - size / 2,
    baseX: center - size / 2,
    y: previous.y - (id < 4 ? 76 : 82 + noise(id + 4) * 16),
    width: size,
    kind,
    hit: 0,
    broken: false,
    star: id > 0 && id % 2 === 0,
  };
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
  reducedMotion = false;
  phase: GamePhase = "idle";
  axis = 0;
  pointerX: number | null = null;
  lookX = 0;
  lookY = 0;
  squash = 0;
  squashVelocity = 0;
  tilt = 0;
  tiltVelocity = 0;
  ears = [0, 0];
  earVelocity = [0, 0];
  camera = 0;
  previousCamera = 0;
  heightMetres = 0;
  stars = 0;
  landings = 0;
  extraHop = true;
  launchY = 0;
  width = 1280;
  height = 800;
  fieldLeft = 0;
  fieldWidth = 600;
  surfaces: Ledge[] = [];
  platforms: Platform[] = [];
  particles: Particle[] = [];
  events: MotionEvent[] = [];
  dragging = false;
  private initialized = false;
  private scrollY = 0;
  private idleOrigin = 0;
  private contact = 0;
  private launchSpeed = HOP_SPEED;
  private platformId = 0;
  private dragX = 0;
  private dragY = 0;
  private lastCameraTarget = 0;

  get playing() {
    return this.phase !== "idle";
  }

  get state() {
    if (this.dragging) return "dragging";
    if (this.phase === "over") return "over";
    if (this.contact > 0) return "crouching";
    if (!this.grounded) return this.vy < 0 ? "jumping" : "falling";
    return Math.abs(this.vx) > 5 ? "walking" : "idle";
  }

  get screenX() {
    return this.x + (this.playing ? this.fieldLeft : 0);
  }

  get screenY() {
    return this.y + this.camera;
  }

  setLayout(surfaces: Ledge[], width: number, height: number, scrollY: number) {
    const oldWidth = this.fieldWidth;
    this.surfaces = surfaces;
    this.width = width;
    this.height = height;
    this.fieldWidth = Math.min(580, width - 32);
    this.fieldLeft = (width - this.fieldWidth) / 2;
    if (!this.initialized) {
      this.resetIdle();
      this.initialized = true;
    } else if (!this.playing) {
      this.y += this.scrollY - scrollY;
      const perch = this.perch();
      if (this.grounded) {
        this.y = perch.y;
        this.x = clamp(this.x, perch.x + 25, perch.x + perch.width - 25);
      }
      this.previousX = this.x;
      this.previousY = this.y;
      this.idleOrigin = this.x;
    } else if (oldWidth !== this.fieldWidth) {
      const ratio = this.fieldWidth / oldWidth;
      this.x *= ratio;
      this.previousX = this.x;
      this.pointerX = null;
      for (const p of this.platforms) {
        p.x *= ratio;
        p.baseX *= ratio;
        p.width *= ratio;
      }
    }
    this.scrollY = scrollY;
  }

  private perch() {
    return (
      this.surfaces.find((s) => s.id === "instrument") ?? {
        id: "floor",
        x: 30,
        y: this.height * 0.64,
        width: this.width - 60,
        goal: false,
      }
    );
  }

  private resetPose() {
    this.previousX = this.x;
    this.previousY = this.y;
    this.vx =
      this.vy =
      this.squash =
      this.squashVelocity =
      this.tilt =
      this.tiltVelocity =
        0;
    this.ears.fill(0);
    this.earVelocity.fill(0);
    this.contact = 0;
    this.dragging = false;
    this.grounded = true;
    this.clearInput();
  }

  private resetIdle() {
    const p = this.perch();
    this.x = p.x + p.width * 0.87;
    this.y = p.y;
    this.idleOrigin = this.x;
    this.camera = this.previousCamera = 0;
    this.resetPose();
  }

  play() {
    if (!this.playing) {
      this.phase = "ready";
      this.reset();
    }
  }

  stop() {
    this.phase = "idle";
    this.platforms = [];
    this.particles = [];
    this.events = [];
    this.resetIdle();
  }

  reset() {
    this.phase = "ready";
    this.x = this.fieldWidth / 2;
    const base = Math.max(180, this.height - 310);
    this.launchY = clamp(
      this.perch().y,
      Math.min(this.height * 0.5, base),
      base,
    );
    this.y = this.launchY;
    this.camera = this.previousCamera = this.lastCameraTarget = 0;
    this.heightMetres = this.stars = this.landings = this.platformId = 0;
    this.extraHop = true;
    this.particles = [];
    this.events = [];
    this.platforms = [
      {
        id: 0,
        x: 18,
        baseX: 18,
        y: this.y,
        width: this.fieldWidth - 36,
        kind: "normal",
        hit: 0,
        broken: false,
        star: false,
      },
    ];
    // The first three ledges make a forgiving, visible on-ramp.
    this.fillPlatforms();
    this.resetPose();
  }

  begin() {
    if (this.phase === "ready") {
      this.phase = "climbing";
      this.contact = 0.09;
      this.launchSpeed = HOP_SPEED;
    }
  }

  clearInput() {
    this.axis = 0;
    this.pointerX = null;
    if (this.dragging) this.release();
  }

  jump() {
    if (this.phase === "ready") {
      this.begin();
      return;
    }
    if (this.phase === "over") {
      this.reset();
      this.begin();
      return;
    }
    if (this.phase !== "climbing" || this.grounded || !this.extraHop) return;
    this.extraHop = false;
    this.vy = -HOP_SPEED * 0.92;
    this.squashVelocity = -4;
    this.emit("extra");
    this.burst(this.x, this.y, false, 9);
  }

  steer(screenX: number) {
    if (this.phase === "climbing")
      this.pointerX = clamp(screenX - this.fieldLeft, 18, this.fieldWidth - 18);
  }

  grab(x: number, y: number) {
    if (this.playing) return;
    this.dragging = true;
    this.grounded = false;
    this.dragTo(x, y);
  }

  dragTo(x: number, y: number) {
    this.dragX = clamp(x, 24, this.width - 24);
    this.dragY = clamp(y + 28, 80, this.height - 25);
  }

  release() {
    this.dragging = false;
    this.vx = clamp(this.vx, -400, 400);
    this.vy = clamp(this.vy, -650, 600);
  }

  private emit(event: MotionEvent) {
    if (this.events.length < 16) this.events.push(event);
  }

  private fillPlatforms() {
    let top = this.platforms[this.platforms.length - 1];
    while (top.y + this.camera > -180) {
      top = nextPlatform(top, ++this.platformId, this.fieldWidth);
      this.platforms.push(top);
    }
  }

  private burst(x: number, y: number, gold: boolean, count = 6) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count && this.particles.length < 80; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (35 + noise(i + this.time) * 65),
        vy: Math.sin(angle) * 70 - 30,
        life: 0.45,
        maxLife: 0.45,
        gold,
      });
    }
  }

  update(dt: number) {
    if (!this.initialized) return;
    this.previousX = this.x;
    this.previousY = this.y;
    this.previousCamera = this.camera;
    this.time += dt;
    const oldVx = this.vx;
    if (this.phase === "idle") this.updateIdle(dt);
    else if (this.phase === "climbing") this.updateClimb(dt);
    this.animate(dt, (this.vx - oldVx) / dt);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 160 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private updateIdle(dt: number) {
    const perch = this.perch();
    if (this.dragging) {
      this.vx += ((this.dragX - this.x) * 145 - this.vx * 21) * dt;
      this.vy += ((this.dragY - this.y) * 145 - this.vy * 21) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      return;
    }
    if (this.grounded) {
      const target = this.reducedMotion
        ? this.x
        : this.idleOrigin + Math.sin(this.time * 0.45) * 22;
      this.vx = damp(this.vx, clamp((target - this.x) * 1.4, -20, 20), 9, dt);
      this.x = clamp(
        this.x + this.vx * dt,
        perch.x + 22,
        perch.x + perch.width - 22,
      );
    } else {
      this.vx = damp(this.vx, 0, 1.5, dt);
      this.x += this.vx * dt;
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (
        this.vy > 0 &&
        this.previousY <= perch.y &&
        this.y >= perch.y &&
        this.x >= perch.x &&
        this.x <= perch.x + perch.width
      ) {
        this.y = perch.y;
        this.vy = 0;
        this.grounded = true;
        this.squashVelocity = 4;
        this.idleOrigin = this.x;
      }
      if (this.y > this.height + 90) this.resetIdle();
    }
  }

  private updateClimb(dt: number) {
    for (const p of this.platforms) {
      p.hit = Math.max(0, p.hit - dt * 3);
      if (p.kind === "moving")
        p.x = p.baseX + Math.sin(this.time * 1.2 + p.id) * 18;
    }
    const targetVx = this.axis
      ? this.axis * RUN_SPEED
      : this.pointerX !== null
        ? clamp((this.pointerX - this.x) * 9, -RUN_SPEED, RUN_SPEED)
        : 0;
    this.vx = damp(this.vx, targetVx, 13, dt);
    this.x = clamp(this.x + this.vx * dt, 16, this.fieldWidth - 16);
    if (this.x === 16 || this.x === this.fieldWidth - 16) this.vx = 0;
    if (this.contact > 0) {
      this.contact = Math.max(0, this.contact - dt);
      if (this.contact === 0) {
        this.vy = -this.launchSpeed;
        this.grounded = false;
        this.squashVelocity = -4.2;
        this.emit(this.launchSpeed > HOP_SPEED ? "spring" : "hop");
      }
    }
    if (!this.grounded) {
      this.vy = Math.min(1000, this.vy + GRAVITY * dt);
      this.y += this.vy * dt;
      let landing: Platform | undefined;
      if (this.vy >= 0)
        for (const p of this.platforms) {
          if (p.broken || this.x + 11 < p.x || this.x - 11 > p.x + p.width)
            continue;
          if (
            this.previousY <= p.y + 0.5 &&
            this.y >= p.y &&
            (!landing || p.y < landing.y)
          )
            landing = p;
        }
      if (landing) {
        this.y = landing.y;
        this.vy = 0;
        this.grounded = true;
        this.contact = 0.065;
        this.launchSpeed = landing.kind === "spring" ? 870 : HOP_SPEED;
        this.extraHop = true;
        this.landings++;
        this.squashVelocity = 5.2;
        landing.hit = 1;
        if (landing.kind === "crumble") landing.broken = true;
        this.burst(this.x, this.y, landing.kind === "spring");
      }
    }
    // Swept star pickup also works during the fast part of a spring launch.
    for (const p of this.platforms) {
      if (!p.star) continue;
      const sx = p.x + p.width / 2;
      const sy = p.y - 31;
      const dx = this.x - this.previousX;
      const dy = this.y - this.previousY;
      const t = clamp(
        ((sx - this.previousX) * dx + (sy - (this.previousY - 23)) * dy) /
          (dx * dx + dy * dy || 1),
        0,
        1,
      );
      if (
        Math.hypot(
          sx - (this.previousX + dx * t),
          sy - (this.previousY - 23 + dy * t),
        ) < 30
      ) {
        p.star = false;
        this.stars++;
        this.emit("star");
        this.burst(sx, sy, true, 10);
      }
    }
    this.heightMetres = Math.max(
      this.heightMetres,
      Math.floor((this.launchY - this.y) / 10),
    );
    this.lastCameraTarget = Math.max(
      this.lastCameraTarget,
      this.height * 0.44 - this.y,
    );
    this.camera = damp(this.camera, this.lastCameraTarget, 7, dt);
    this.fillPlatforms();
    this.platforms = this.platforms.filter(
      (p) => p.y + this.camera < this.height + 140,
    );
    if (this.screenY > this.height + 65) {
      this.phase = "over";
      this.clearInput();
      this.emit("over");
    }
  }

  private animate(dt: number, acceleration: number) {
    this.gait += Math.abs(this.vx) * dt * 0.11;
    const target = this.reducedMotion
      ? 0
      : this.contact > 0
        ? 0.25
        : !this.grounded
          ? clamp(this.vy / 3700, -0.17, 0.11)
          : 0;
    this.squashVelocity +=
      ((target - this.squash) * 280 - this.squashVelocity * 20) * dt;
    this.squash = clamp(this.squash + this.squashVelocity * dt, -0.25, 0.3);
    const tiltTarget = this.reducedMotion
      ? 0
      : clamp(this.vx * 0.00065, -0.2, 0.2);
    this.tiltVelocity +=
      ((tiltTarget - this.tilt) * 160 - this.tiltVelocity * 19) * dt;
    this.tilt += this.tiltVelocity * dt;
    for (let i = 0; i < 2; i++) {
      const targetEar = this.reducedMotion
        ? 0
        : clamp(
            -this.vx * 0.0012 -
              acceleration * 0.0001 +
              Math.sin(this.time * 2.1 + i) * 0.025 +
              this.squashVelocity * (i ? 0.08 : -0.06),
            -0.65,
            0.65,
          );
      this.earVelocity[i] +=
        ((targetEar - this.ears[i]) * (i ? 100 : 125) -
          this.earVelocity[i] * 12) *
        dt;
      this.ears[i] = clamp(this.ears[i] + this.earVelocity[i] * dt, -0.7, 0.7);
    }
  }
}
