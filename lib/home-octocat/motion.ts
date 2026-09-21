/** Pixels, positive Y down. Input, locomotion, reactions and rendering stay separate. */
export interface Ledge {
  id: string;
  x: number;
  y: number;
  width: number;
  goal: boolean;
}
export type PlatformKind =
  | "normal"
  | "spring"
  | "moving"
  | "crumble"
  | "checkpoint";
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
  crumble?: number;
  puff?: { x: number; defeated: boolean; squash: number };
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
export interface Foot {
  x: number;
  y: number;
  from: number;
  target: number;
  progress: number;
  moving: boolean;
  stance: number;
}
export type Reaction =
  | "none"
  | "wave"
  | "boop"
  | "dizzy"
  | "delight"
  | "hurt"
  | "surprise";
export type GamePhase = "idle" | "ready" | "climbing" | "over";
export type MotionEvent =
  | "hop"
  | "spring"
  | "star"
  | "extra"
  | "over"
  | "land"
  | "boop"
  | "hurt"
  | "checkpoint"
  | "stomp";
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export const GRAVITY = 1500;
export const HOP_SPEED = 650;
export const RUN_SPEED = 260;
const damp = (a: number, b: number, rate: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-rate * dt));
const noise = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Consecutive footholds fit a held normal jump, with room to avoid a patrol. */
export function nextPlatform(
  previous: Platform,
  id: number,
  width: number,
): Platform {
  const difficulty = Math.min(1, id / 70);
  const kind: PlatformKind =
    id % 8 === 0
      ? "checkpoint"
      : id % 8 === 5
        ? "spring"
        : id > 8 && id % 8 === 7
          ? "crumble"
          : id > 5 && id % 8 === 2
            ? "moving"
            : "normal";
  const size = Math.min(
    width * 0.5,
    kind === "checkpoint" ? 170 : 140 - difficulty * 30,
  );
  const direction = Math.sin(id * 0.82) > 0 ? 1 : -1;
  const stride = id < 4 ? 30 + id * 8 : 65 + noise(id) * 50;
  const center = clamp(
    previous.baseX + previous.width / 2 + direction * stride,
    size / 2 + 30,
    width - size / 2 - 30,
  );
  return {
    id,
    x: center - size / 2,
    baseX: center - size / 2,
    y: previous.y - (id < 4 ? 70 : 80 + noise(id + 4) * 14),
    width: size,
    kind,
    hit: 0,
    broken: false,
    star: id % 2 === 0 && kind !== "checkpoint",
    ...(id >= 4 && id % 8 === 4
      ? { puff: { x: center, defeated: false, squash: 0 } }
      : {}),
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
  lookActive = false;
  gazeX = 0;
  gazeY = 0;
  blink = 1;
  squash = 0;
  squashVelocity = 0;
  tilt = 0;
  tiltVelocity = 0;
  ears = [0, 0];
  earVelocity = [0, 0];
  facing = 0;
  skid = 0;
  edge = 0;
  camera = 0;
  previousCamera = 0;
  heightMetres = 0;
  stars = 0;
  landings = 0;
  extraHop = true;
  jumpHeld = false;
  lives = 3;
  invulnerable = 0;
  recovering = 0;
  launchY = 0;
  width = 1280;
  height = 800;
  fieldLeft = 0;
  fieldWidth = 580;
  surfaces: Ledge[] = [];
  platforms: Platform[] = [];
  particles: Particle[] = [];
  events: MotionEvent[] = [];
  feet: Foot[] = [this.makeFoot(), this.makeFoot()];
  dragging = false;
  reaction: Reaction = "none";
  reactionAge = 0;
  reactionDuration = 0;
  sleepy = 0;
  attention = 0;
  checkpointId = 0;
  private initialized = false;
  private scrollY = 0;
  private idleOrigin = 0;
  private anticipation = 0;
  private jumpBuffer = 0;
  private coyote = 0;
  private jumpAge = 1;
  private jumpCut = 510;
  private platformId = 0;
  private supportId: number | null = null;
  private dragX = 0;
  private dragY = 0;
  private lastCameraTarget = 0;
  private blinkAt = 2.8;
  private blinkStart = -10;
  private blinkIndex = 0;
  private doubleBlink = false;
  private lastInteraction = 0;
  private lastWave = -10;
  private lastBoop = -10;
  private boops = 0;
  private nextFoot = 0;
  private checkpoint: Platform | null = null;
  private claimedStars = new Set<number>();
  private defeatedPuffs = new Set<number>();

  private makeFoot(): Foot {
    return {
      x: 0,
      y: 0,
      from: 0,
      target: 0,
      progress: 1,
      moving: false,
      stance: 0,
    };
  }

  get playing() {
    return this.phase !== "idle";
  }

  get state() {
    if (this.dragging) return "dragging";
    if (this.phase === "over") return "over";
    if (this.recovering > 0) return "hurt";
    if (this.anticipation > 0) return "crouching";
    if (!this.grounded) return this.vy < 0 ? "jumping" : "falling";
    if (this.skid > 0.1) return "skidding";
    return Math.abs(this.vx) > 5 ? "walking" : "idle";
  }

  get screenX() {
    return this.x + (this.playing ? this.fieldLeft : 0);
  }

  get screenY() {
    return this.y + this.camera;
  }

  get reactionWeight() {
    if (this.reaction === "none") return 0;
    // Quick readable attack, soft release, never reset the live gaze target.
    return Math.min(
      1,
      this.reactionAge / 0.07,
      (this.reactionDuration - this.reactionAge) / 0.18,
    );
  }

  setLayout(surfaces: Ledge[], width: number, height: number, scrollY: number) {
    const oldWidth = this.fieldWidth;
    this.surfaces = surfaces;
    this.width = width;
    this.height = height;
    this.fieldWidth = Math.max(200, Math.min(580, width - 32));
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
      this.resetFeet();
    } else if (oldWidth !== this.fieldWidth) {
      const ratio = this.fieldWidth / oldWidth;
      this.x *= ratio;
      this.previousX = this.x;
      this.pointerX = null;
      for (const p of this.platforms) {
        p.x *= ratio;
        p.baseX *= ratio;
        p.width *= ratio;
        if (p.puff) p.puff.x *= ratio;
      }
      if (this.checkpoint) {
        this.checkpoint.x *= ratio;
        this.checkpoint.baseX *= ratio;
        this.checkpoint.width *= ratio;
      }
      this.resetFeet();
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

  private resetFeet() {
    this.feet.forEach((f, i) => {
      f.x = this.x + (i ? 9 : -9);
      f.y = this.y;
      f.from = f.target = f.x;
      f.progress = 1;
      f.moving = false;
      f.stance = 0;
    });
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
      this.skid =
      this.edge =
        0;
    this.ears.fill(0);
    this.earVelocity.fill(0);
    this.anticipation = this.coyote = 0;
    this.dragging = false;
    this.grounded = true;
    this.clearInput();
    this.resetFeet();
  }

  private resetIdle() {
    const p = this.perch();
    this.x = p.x + p.width * 0.87;
    this.y = p.y;
    this.idleOrigin = this.x;
    this.camera = this.previousCamera = 0;
    this.resetPose();
    this.attend();
  }

  play() {
    if (!this.playing) this.reset();
  }

  stop() {
    this.phase = "idle";
    this.platforms = [];
    this.particles = [];
    this.events = [];
    this.recovering = 0;
    this.reaction = "none";
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
    this.heightMetres =
      this.stars =
      this.landings =
      this.platformId =
      this.checkpointId =
        0;
    this.extraHop = true;
    this.lives = 3;
    this.invulnerable = this.recovering = 0;
    this.particles = [];
    this.events = [];
    this.claimedStars.clear();
    this.defeatedPuffs.clear();
    this.reaction = "none";
    this.sleepy = 0;
    const basePlatform: Platform = {
      id: 0,
      x: 18,
      baseX: 18,
      y: this.y,
      width: this.fieldWidth - 36,
      kind: "normal",
      hit: 0,
      broken: false,
      star: false,
    };
    this.platforms = [basePlatform];
    this.checkpoint = { ...basePlatform };
    this.supportId = 0;
    this.fillPlatforms();
    this.resetPose();
  }

  /** Entering the course never jumps. Every launch belongs to a new press. */
  begin() {
    if (this.phase === "ready") {
      this.phase = "climbing";
      this.attend();
      this.react("wave", 0.75);
    }
  }

  clearInput() {
    this.axis = 0;
    this.pointerX = null;
    this.jumpHeld = false;
    this.jumpBuffer = 0;
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
    if (this.phase !== "climbing" || this.jumpHeld || this.recovering > 0)
      return;
    this.attend();
    this.jumpHeld = true;
    this.jumpBuffer = 0.14;
    if (this.grounded || this.coyote > 0) return;
    // A near-landing press belongs to the next ground jump, not a wasted air hop.
    const landingSoon =
      this.vy > 0 &&
      this.platforms.some(
        (p) =>
          !p.broken &&
          this.x > p.x - 8 &&
          this.x < p.x + p.width + 8 &&
          p.y >= this.y &&
          p.y - this.y < this.vy * 0.14 + 8,
      );
    if (this.extraHop && !landingSoon) {
      this.extraHop = false;
      this.jumpBuffer = 0;
      this.launch(HOP_SPEED * 0.88, "extra");
      this.burst(this.x, this.y, false, 9);
    }
  }

  releaseJump() {
    this.jumpHeld = false;
    if (this.vy < -this.jumpCut) this.vy = -this.jumpCut;
  }

  steer(screenX: number) {
    if (this.phase === "climbing" && !this.recovering)
      this.pointerX = clamp(screenX - this.fieldLeft, 18, this.fieldWidth - 18);
  }

  attend() {
    this.lastInteraction = this.time;
  }

  hover() {
    this.attend();
    if (
      !this.playing &&
      this.time - this.lastWave > 3 &&
      this.reaction === "none"
    ) {
      this.lastWave = this.time;
      this.react("wave", 0.9);
    }
  }

  boop() {
    if (this.playing || this.dragging) return;
    this.attend();
    this.boops = this.time - this.lastBoop < 1.2 ? this.boops + 1 : 1;
    this.lastBoop = this.time;
    this.react(
      this.boops >= 3 ? "dizzy" : "boop",
      this.boops >= 3 ? 1.1 : 0.65,
    );
    if (this.boops >= 3) this.boops = 0;
    if (!this.reducedMotion) this.squashVelocity = 2.8;
    this.emit("boop");
  }

  private react(name: Reaction, duration: number) {
    // Direct affection must finish before a contextual celebration can replace it.
    if (
      this.reaction === "hurt" &&
      this.reactionAge < this.reactionDuration &&
      name !== "hurt"
    )
      return;
    if (
      (this.reaction === "boop" || this.reaction === "dizzy") &&
      name === "delight"
    )
      return;
    this.reaction = name;
    this.reactionAge = 0;
    this.reactionDuration = duration;
  }

  grab(x: number, y: number) {
    if (this.playing) return;
    this.attend();
    this.dragging = true;
    this.grounded = false;
    this.react("surprise", 0.8);
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
    if (!top) return;
    while (top.y + this.camera > -180) {
      top = nextPlatform(top, ++this.platformId, this.fieldWidth);
      if (this.claimedStars.has(top.id)) top.star = false;
      if (top.puff && this.defeatedPuffs.has(top.id)) top.puff.defeated = true;
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

  private launch(speed: number, event: MotionEvent) {
    this.jumpCut = event === "spring" ? 640 : 510;
    this.vy = -(this.jumpHeld ? speed : Math.min(speed, this.jumpCut));
    this.jumpAge = 0;
    this.grounded = false;
    this.supportId = null;
    this.coyote = 0;
    this.anticipation = 0;
    this.squashVelocity = this.reducedMotion ? 0 : -3.6;
    this.emit(event);
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
    this.updateFeet(dt);
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
      const near =
        this.lookActive &&
        Math.abs(this.lookX - this.x) < 310 &&
        Math.abs(this.lookY - (this.y - 28)) < 160;
      let target = this.x;
      if (
        !this.reducedMotion &&
        this.reaction !== "boop" &&
        this.reaction !== "dizzy"
      ) {
        if (near && Math.abs(this.lookX - this.x) > 48)
          target = this.lookX - Math.sign(this.lookX - this.x) * 42;
        else if (!near && this.time - this.lastInteraction < 12)
          target = this.idleOrigin + Math.sin(this.time * 0.33) * 16;
      }
      target = clamp(target, perch.x + 24, perch.x + perch.width - 24);
      this.vx = damp(this.vx, clamp((target - this.x) * 2.5, -72, 72), 10, dt);
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
        this.resetFeet();
        this.react("delight", 0.6);
      }
      if (this.y > this.height + 90) this.resetIdle();
    }
  }

  private updateClimb(dt: number) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (this.recovering > 0) {
      this.recovering = Math.max(0, this.recovering - dt);
      this.vx = damp(this.vx, 0, 8, dt);
      if (!this.recovering) this.respawn();
      return;
    }
    let support = this.platforms.find(
      (p) => p.id === this.supportId && !p.broken,
    );
    for (const p of this.platforms) {
      p.hit = Math.max(0, p.hit - dt * 3);
      if (p.kind === "moving") {
        const lastX = p.x;
        p.x = p.baseX + Math.sin(this.time * 1.2 + p.id) * 18;
        if (this.grounded && support === p) {
          const carry = p.x - lastX;
          this.x += carry;
          for (const f of this.feet) {
            f.x += carry;
            f.from += carry;
            f.target += carry;
          }
        }
      }
      if (p.crumble !== undefined && !p.broken) {
        p.crumble -= dt;
        if (p.crumble <= 0) {
          p.broken = true;
          p.hit = 1;
          this.burst(p.x + p.width / 2, p.y, false);
        }
      }
      if (p.puff) {
        p.puff.x =
          p.x +
          p.width / 2 +
          Math.sin(this.time * 1.3 + p.id) * (p.width * 0.18);
        p.puff.squash = Math.max(0, p.puff.squash - dt * 2);
      }
    }
    const targetVx = this.axis
      ? this.axis * RUN_SPEED
      : this.pointerX !== null
        ? clamp((this.pointerX - this.x) * 8, -RUN_SPEED, RUN_SPEED)
        : 0;
    const braking =
      this.grounded &&
      Math.abs(this.vx) > 85 &&
      (Math.sign(targetVx) !== Math.sign(this.vx) || Math.abs(targetVx) < 8);
    if (braking && this.skid < 0.1) this.burst(this.x, this.y - 1, false, 3);
    this.skid = damp(this.skid, braking ? 1 : 0, 16, dt);
    this.vx = damp(this.vx, targetVx, this.grounded ? 15 : 8, dt);
    this.x = clamp(this.x + this.vx * dt, 16, this.fieldWidth - 16);
    if (this.x === 16 || this.x === this.fieldWidth - 16) this.vx = 0;
    if (this.grounded) {
      if (
        !support ||
        support.broken ||
        this.x < support.x - 5 ||
        this.x > support.x + support.width + 5
      ) {
        this.grounded = false;
        this.supportId = null;
        this.coyote = 0.1;
        support = undefined;
      } else {
        this.y = support.y;
        this.coyote = 0.1;
        const edgeDistance = Math.min(
          this.x - support.x,
          support.x + support.width - this.x,
        );
        this.edge = damp(
          this.edge,
          edgeDistance < 14 && Math.abs(this.vx) < 25
            ? Math.sign(this.x - support.x - support.width / 2)
            : 0,
          9,
          dt,
        );
      }
    } else {
      this.coyote = Math.max(0, this.coyote - dt);
      this.edge = damp(this.edge, 0, 12, dt);
    }
    if (
      this.jumpBuffer > 0 &&
      (this.grounded || this.coyote > 0) &&
      this.anticipation === 0
    ) {
      this.jumpBuffer = 0;
      this.anticipation = 0.035;
    }
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.anticipation > 0) {
      this.anticipation = Math.max(0, this.anticipation - dt);
      if (!this.anticipation)
        this.launch(
          support?.kind === "spring" ? 820 : HOP_SPEED,
          support?.kind === "spring" ? "spring" : "hop",
        );
    }
    if (!this.grounded) {
      this.jumpAge += dt;
      const gravity =
        this.jumpHeld && this.vy < 0 && this.jumpAge < 0.19
          ? GRAVITY * 0.72
          : GRAVITY;
      this.vy = Math.min(1000, this.vy + gravity * dt);
      this.y += this.vy * dt;
      let landing: Platform | undefined;
      if (this.vy >= 0)
        for (const p of this.platforms) {
          if (p.broken || this.x + 10 < p.x || this.x - 10 > p.x + p.width)
            continue;
          if (
            this.previousY <= p.y + 0.5 &&
            this.y >= p.y &&
            (!landing || p.y < landing.y)
          )
            landing = p;
        }
      if (landing) this.land(landing);
    }
    for (const p of this.platforms) {
      if (p.puff && !p.puff.defeated && !this.invulnerable) {
        const px = p.puff.x;
        const top = p.y - 23;
        const stomp =
          this.vy > 0 &&
          this.previousY <= top + 4 &&
          this.y >= top &&
          Math.abs(this.x - px) < 22;
        if (stomp) {
          p.puff.defeated = true;
          p.puff.squash = 1;
          this.defeatedPuffs.add(p.id);
          this.stars += 2;
          this.vy = Math.min(this.vy, 120);
          this.squashVelocity = 3;
          this.react("delight", 0.7);
          this.emit("stomp");
          this.burst(px, top, true, 12);
        } else if (
          Math.abs(this.x - px) < 23 &&
          Math.abs(this.y - 20 - (p.y - 12)) < 28
        ) {
          this.hurt(px);
          break;
        }
      }
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
        ) < 28
      ) {
        p.star = false;
        this.claimedStars.add(p.id);
        this.stars++;
        this.emit("star");
        this.react("delight", 0.55);
        this.burst(sx, sy, true, 10);
      }
    }
    this.heightMetres = Math.max(
      this.heightMetres,
      Math.floor((this.launchY - this.y) / 10),
    );
    // Keep the current foothold available when exploring; progress only lifts the camera.
    this.lastCameraTarget = Math.max(
      this.lastCameraTarget,
      this.height * 0.43 - this.y,
    );
    this.camera = damp(this.camera, this.lastCameraTarget, 7, dt);
    this.fillPlatforms();
    this.platforms = this.platforms.filter(
      (p) => p.y + this.camera < this.height + 140,
    );
    if (this.screenY > this.height + 65 && !this.recovering) this.hurt(this.x);
  }

  private land(p: Platform) {
    const impact = this.vy;
    this.y = p.y;
    this.vy = 0;
    this.grounded = true;
    this.supportId = p.id;
    this.coyote = 0.1;
    this.extraHop = true;
    this.landings++;
    this.resetFeet();
    this.squashVelocity = this.reducedMotion
      ? 0
      : clamp(impact / 140, 1.5, 5.5);
    p.hit = 1;
    if (p.kind === "crumble" && p.crumble === undefined) p.crumble = 0.95;
    this.emit("land");
    this.burst(this.x, this.y, false, impact > 500 ? 7 : 4);
    if (p.kind === "checkpoint" && p.id > this.checkpointId) {
      this.checkpointId = p.id;
      this.checkpoint = { ...p, hit: 0 };
      this.lives = Math.min(3, this.lives + 1);
      // Everything below the new checkpoint is unreachable; keep reward memory bounded.
      this.claimedStars.forEach((id) => {
        if (id < p.id) this.claimedStars.delete(id);
      });
      this.defeatedPuffs.forEach((id) => {
        if (id < p.id) this.defeatedPuffs.delete(id);
      });
      this.react("delight", 1.2);
      this.emit("checkpoint");
      this.burst(this.x, this.y - 18, true, 18);
    }
  }

  private hurt(sourceX: number) {
    if (this.recovering > 0) return;
    this.lives--;
    this.clearInput();
    this.vx = (Math.sign(this.x - sourceX) || 1) * 70;
    this.react("hurt", 0.7);
    this.emit("hurt");
    if (this.lives <= 0) {
      this.phase = "over";
      this.emit("over");
    } else this.recovering = 0.65;
  }

  private respawn() {
    if (!this.checkpoint) return;
    const p = { ...this.checkpoint, hit: 0, broken: false };
    this.platforms = [p];
    this.platformId = p.id;
    this.supportId = p.id;
    this.x = p.x + p.width / 2;
    this.y = p.y;
    this.camera =
      this.previousCamera =
      this.lastCameraTarget =
        Math.max(0, this.height * 0.54 - p.y);
    this.resetPose();
    this.extraHop = true;
    this.invulnerable = 1.4;
    this.fillPlatforms();
    this.react("wave", 0.7);
    this.burst(this.x, this.y - 12, false, 12);
  }

  private updateFeet(dt: number) {
    if (this.reducedMotion) {
      this.resetFeet();
      return;
    }
    const speed = Math.abs(this.vx);
    if (!this.grounded) {
      for (let i = 0; i < 2; i++) {
        const f = this.feet[i];
        const side = i ? 1 : -1;
        f.x = this.x + side * 9 - clamp(this.vx * 0.025, -7, 7);
        f.y =
          this.y -
          (this.dragging ? 0 : clamp(-this.vy / 100, 0, 6)) +
          side * clamp(this.vx / 100, -2, 2);
        f.moving = false;
      }
      return;
    }
    const duration = clamp(0.17 - speed * 0.00038, 0.072, 0.17);
    for (let i = 0; i < this.feet.length; i++) {
      const f = this.feet[i];
      if (!f.moving) {
        f.stance = Math.max(0, f.stance - dt);
        f.y = this.y;
        continue;
      }
      f.progress = Math.min(1, f.progress + dt / duration);
      if (f.progress < 0.75)
        f.target = damp(
          f.target,
          this.x + (i ? 9 : -9) + clamp(this.vx * duration * 0.9, -22, 22),
          28,
          dt,
        );
      const t = f.progress;
      const ease = t * t * (3 - 2 * t);
      f.x = f.from + (f.target - f.from) * ease;
      f.y = this.y - Math.sin(t * Math.PI) * (4 + Math.min(speed / 45, 4));
      if (t >= 1) {
        f.moving = false;
        f.stance = duration * 0.6;
        f.y = this.y;
        this.nextFoot = this.feet.indexOf(f) === 0 ? 1 : 0;
      }
    }
    // Walk with alternating stance. Running may overlap the end of a swing;
    // never drag a planted foot to hide a turn or let a leg overextend.
    for (const i of [this.nextFoot, 1 - this.nextFoot]) {
      const f = this.feet[i];
      if (f.moving) continue;
      const rest = this.x + (i ? 9 : -9);
      const distance = Math.abs(f.x - rest);
      if (f.stance > 0 && distance < 16) continue;
      if (distance <= (speed > 20 ? 4 : 1.5)) continue;
      const other = this.feet[1 - i];
      if (
        other.moving &&
        (speed < 90 || other.progress < 0.45) &&
        distance < 16
      )
        continue;
      f.moving = true;
      f.from = f.x;
      f.target = rest + clamp(this.vx * duration * 1.1, -20, 20);
      f.progress = 0;
    }
  }

  private animate(dt: number, acceleration: number) {
    this.reactionAge += dt;
    if (this.reactionAge >= this.reactionDuration) this.reaction = "none";
    this.sleepy = damp(
      this.sleepy,
      !this.playing && !this.dragging && this.time - this.lastInteraction > 16
        ? 1
        : 0,
      4,
      dt,
    );
    const dx = this.lookX - this.screenX;
    const dy = this.lookY - (this.screenY - 25);
    const outside = Math.hypot(dx, dy) > 16;
    const gazeX = this.playing
      ? clamp(this.vx / 120, -2.2, 2.2)
      : this.lookActive && outside
        ? clamp(dx / 150, -2.5, 2.5)
        : 0;
    const gazeY = this.playing
      ? clamp(this.vy / 650, -0.9, 0.9)
      : this.lookActive && outside
        ? clamp(dy / 240, -1.2, 1.2)
        : 0;
    this.gazeX = damp(this.gazeX, this.reducedMotion ? 0 : gazeX, 12, dt);
    this.gazeY = damp(this.gazeY, this.reducedMotion ? 0 : gazeY, 12, dt);
    this.attention = damp(
      this.attention,
      this.lookActive && Math.hypot(dx, dy) < 110 ? 1 : 0,
      8,
      dt,
    );
    this.facing = damp(
      this.facing,
      Math.abs(this.vx) > 8 ? Math.sign(this.vx) : this.gazeX * 0.2,
      10,
      dt,
    );
    if (!this.reducedMotion && this.time >= this.blinkAt) {
      this.blinkStart = this.time;
      this.blinkIndex++;
      this.doubleBlink = noise(this.blinkIndex + 51) < 0.12;
      this.blinkAt = this.time + 2.5 + noise(this.blinkIndex + 19) * 3.5;
    }
    const age = this.time - this.blinkStart;
    const closure = this.doubleBlink && age > 0.28 ? age - 0.28 : age;
    this.blink =
      !this.reducedMotion && closure >= 0 && closure < 0.18
        ? 0.08 + (0.92 * Math.abs(closure - 0.09)) / 0.09
        : 1;
    this.gait += speedGait(this.vx) * dt;
    const target = this.reducedMotion
      ? 0
      : this.anticipation > 0
        ? 0.23
        : !this.grounded
          ? clamp(this.vy / 3700, -0.17, 0.11)
          : this.reaction === "boop"
            ? this.reactionWeight * 0.08
            : 0;
    this.squashVelocity +=
      ((target - this.squash) * 280 - this.squashVelocity * 20) * dt;
    this.squash = clamp(this.squash + this.squashVelocity * dt, -0.25, 0.3);
    const tiltTarget = this.reducedMotion
      ? 0
      : clamp(
          this.vx * 0.00055 + acceleration * 0.000025 + this.edge * 0.08,
          -0.2,
          0.2,
        );
    this.tiltVelocity +=
      ((tiltTarget - this.tilt) * 160 - this.tiltVelocity * 19) * dt;
    this.tilt += this.tiltVelocity * dt;
    for (let i = 0; i < 2; i++) {
      const targetEar = this.reducedMotion
        ? 0
        : clamp(
            -this.vx * 0.0012 -
              acceleration * 0.00009 +
              Math.sin(this.time * 2.1 + i) * 0.025 +
              this.squashVelocity * (i ? 0.08 : -0.06) +
              this.sleepy * (i ? 0.2 : -0.18),
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
const speedGait = (vx: number) => Math.abs(vx) * 0.085;
