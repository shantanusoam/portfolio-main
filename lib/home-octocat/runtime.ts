import { FixedStepLoop } from "@/lib/mascot/core/FixedStepLoop";
import { HomeOctocatMotion, type Ledge, type GamePhase } from "./motion";
import { createHomeOctocatRenderer } from "./renderer";
import { WorldRenderer } from "./worldRenderer";
import { MochiAudio } from "./audio";

export interface GameSnapshot {
  phase: GamePhase;
  height: number;
  stars: number;
  extraHop: boolean;
  grounded: boolean;
  lives: number;
  checkpoint: number;
  recovering: boolean;
}
interface Callbacks {
  onGame: (game: GameSnapshot) => void;
  onUnavailable: () => void;
}

export class HomeOctocatRuntime {
  readonly motion = new HomeOctocatMotion();
  readonly audio = new MochiAudio();
  private readonly renderer: ReturnType<typeof createHomeOctocatRenderer>;
  private readonly world: WorldRenderer;
  private readonly loop: FixedStepLoop;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private settleTimer: ReturnType<typeof setTimeout> | undefined;
  private signature = "";
  private visible = true;
  private paused = false;
  private destroyed = false;
  private unavailable = false;
  private originalTranslate: string;
  private originalWillChange: string;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    worldCanvas: HTMLCanvasElement,
    private readonly hitTarget: HTMLButtonElement,
    private readonly hero: HTMLElement,
    private readonly callbacks: Callbacks,
    private readonly companionControls?: HTMLDivElement,
  ) {
    this.originalTranslate = hero.style.translate;
    this.originalWillChange = hero.style.willChange;
    this.renderer = createHomeOctocatRenderer(canvas);
    this.world = new WorldRenderer(worldCanvas);
    this.loop = new FixedStepLoop({
      fixedDt: 1 / 120,
      maxSteps: 6,
      update: (dt) => this.motion.update(dt),
      render: (alpha) => this.render(alpha),
    });
    this.resizeObserver = new ResizeObserver(this.scheduleRefresh);
    this.resizeObserver.observe(hero);
    hero
      .querySelectorAll<HTMLElement>("[data-octocat-surface]")
      .forEach((el) => this.resizeObserver.observe(el));
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (!this.motion.playing) {
          canvas.style.visibility = this.visible ? "visible" : "hidden";
          hitTarget.style.visibility = this.visible ? "visible" : "hidden";
          if (this.companionControls)
            this.companionControls.style.visibility = this.visible
              ? "visible"
              : "hidden";
        }
        this.syncLoop();
      },
      { threshold: [0, 0.2] },
    );
    this.intersectionObserver.observe(hero);
    window.addEventListener("scroll", this.scheduleRefresh, { passive: true });
    window.addEventListener("resize", this.scheduleRefresh, { passive: true });
    window.addEventListener("pointermove", this.look, { passive: true });
    window.addEventListener("pointerout", this.lookAway, { passive: true });
    document.addEventListener("visibilitychange", this.syncLoop);
    document.fonts.addEventListener("loadingdone", this.scheduleRefresh);
    canvas.addEventListener("webglcontextlost", this.contextLost);
    this.refresh();
    this.settleTimer = setTimeout(this.refresh, 1100);
    this.syncLoop();
  }

  private look = (event: PointerEvent) => {
    this.motion.lookX = event.clientX;
    this.motion.lookY = event.clientY;
    this.motion.lookActive = true;
    this.motion.attend();
  };

  private lookAway = (event: PointerEvent) => {
    if (!event.relatedTarget) this.motion.lookActive = false;
  };

  private contextLost = (event: Event) => {
    event.preventDefault();
    this.unavailable = true;
    this.loop.stop();
    this.motion.clearInput();
    this.callbacks.onUnavailable();
  };

  private scheduleRefresh = () => {
    if (this.refreshTimer !== undefined) return;
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = undefined;
      this.refresh();
    }, 50);
  };

  private refresh = () => {
    if (this.destroyed) return;
    // Active world geometry is independent of the translated hero underneath it.
    const surfaces: Ledge[] = this.motion.playing ? this.motion.surfaces : [];
    if (!this.motion.playing)
      this.hero
        .querySelectorAll<HTMLElement>("[data-octocat-surface]")
        .forEach((element) => {
          let rect = element.getBoundingClientRect();
          if (rect.width < 20 || rect.height === 0) return;
          if (element.dataset.octocatSurface === "instrument") {
            const string = element
              .querySelector<SVGGraphicsElement>(
                "[data-mascot-string-index='0']",
              )
              ?.getBoundingClientRect();
            if (string && string.width > 20) rect = string;
          }
          surfaces.push({
            id: element.dataset.octocatSurface!,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            goal: false,
          });
        });
    this.motion.setLayout(
      surfaces,
      window.innerWidth,
      window.innerHeight,
      window.scrollY,
    );
    this.world.resize(window.innerWidth, window.innerHeight);
    this.render();
  };

  private render(alpha = 1) {
    if (this.unavailable || this.destroyed) return;
    this.world.render(this.motion, alpha);
    const { x, y } = this.renderer.render(this.motion, alpha);
    this.hitTarget.style.transform = `translate3d(${x - 32}px,${y - 72}px,0)`;
    this.hitTarget.dataset.motion = this.motion.state;
    this.hitTarget.dataset.reaction = this.motion.reaction;
    if (this.companionControls)
      this.companionControls.style.transform = `translate3d(${x - 39}px,${
        y + 13
      }px,0)`;
    if (this.motion.playing)
      this.hero.style.translate = `0 ${-this.motion.camera * 0.7}px`;
    for (const event of this.motion.events.splice(0)) this.audio.play(event);
    const m = this.motion;
    const signature = `${m.phase}:${m.heightMetres}:${m.stars}:${m.extraHop}:${
      m.grounded
    }:${m.lives}:${m.checkpointId}:${m.recovering > 0}`;
    if (signature !== this.signature) {
      this.signature = signature;
      this.callbacks.onGame({
        phase: m.phase,
        height: m.heightMetres,
        stars: m.stars,
        extraHop: m.extraHop,
        grounded: m.grounded,
        lives: m.lives,
        checkpoint: m.checkpointId,
        recovering: m.recovering > 0,
      });
    }
    if (
      m.phase === "over" ||
      (m.reducedMotion &&
        !m.playing &&
        !m.dragging &&
        m.grounded &&
        m.reaction === "none")
    )
      this.loop.stop();
  }

  private syncLoop = () => {
    if (this.destroyed || this.unavailable) return;
    const m = this.motion;
    if (
      !document.hidden &&
      (this.visible || m.playing) &&
      !this.paused &&
      m.phase !== "over" &&
      (!m.reducedMotion ||
        m.phase === "climbing" ||
        m.dragging ||
        !m.grounded ||
        m.reaction !== "none")
    )
      this.loop.start();
    else {
      this.loop.stop();
      this.render();
    }
  };

  setReducedMotion(reduced: boolean) {
    this.motion.reducedMotion = reduced;
    this.syncLoop();
  }

  play() {
    this.refresh();
    this.motion.play();
    this.paused = false;
    this.canvas.style.visibility = "visible";
    this.hero.style.willChange = "translate";
    this.syncLoop();
    this.render();
  }

  wake() {
    this.syncLoop();
  }

  begin() {
    this.motion.begin();
    this.syncLoop();
  }

  restart() {
    this.motion.reset();
    this.motion.begin();
    this.paused = false;
    this.syncLoop();
    this.render();
  }

  stop() {
    this.restoreHero();
    this.motion.stop();
    this.paused = false;
    this.refresh();
    this.syncLoop();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.motion.clearInput();
    this.syncLoop();
  }

  private restoreHero() {
    this.hero.style.translate = this.originalTranslate;
    this.hero.style.willChange = this.originalWillChange;
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    this.restoreHero();
    clearTimeout(this.refreshTimer);
    clearTimeout(this.settleTimer);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    window.removeEventListener("scroll", this.scheduleRefresh);
    window.removeEventListener("resize", this.scheduleRefresh);
    window.removeEventListener("pointermove", this.look);
    window.removeEventListener("pointerout", this.lookAway);
    document.removeEventListener("visibilitychange", this.syncLoop);
    document.fonts.removeEventListener("loadingdone", this.scheduleRefresh);
    this.canvas.removeEventListener("webglcontextlost", this.contextLost);
    this.renderer.destroy();
    this.world.destroy();
    this.audio.destroy();
  }
}
