import { FixedStepLoop } from "@/lib/mascot/core/FixedStepLoop";
import { HomeOctocatMotion, type Ledge } from "./motion";
import { HomeOctocatRenderer } from "./renderer";

interface Callbacks {
  onLayout: (surfaces: Ledge[]) => void;
  onScore: (visited: string[]) => void;
  onLeaveHero: () => void;
  onUnavailable: () => void;
}

/** Owns one animation loop, cached DOM geometry, and explicit teardown. */
export class HomeOctocatRuntime {
  readonly motion = new HomeOctocatMotion();
  private readonly renderer: HomeOctocatRenderer;
  private readonly loop: FixedStepLoop;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private settleTimer: ReturnType<typeof setTimeout> | undefined;
  private score = -1;
  private visible = true;
  private paused = false;
  private destroyed = false;
  private unavailable = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly hitTarget: HTMLButtonElement,
    private readonly hero: HTMLElement,
    private readonly callbacks: Callbacks,
  ) {
    this.renderer = new HomeOctocatRenderer(canvas);
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
        this.visible = entry.isIntersecting && entry.intersectionRatio > 0.2;
        canvas.style.visibility = this.visible ? "visible" : "hidden";
        hitTarget.style.visibility = this.visible ? "visible" : "hidden";
        if (!this.visible && this.motion.playing) callbacks.onLeaveHero();
        this.syncLoop();
      },
      { threshold: [0, 0.2, 0.5] },
    );
    this.intersectionObserver.observe(hero);
    window.addEventListener("scroll", this.scheduleRefresh, { passive: true });
    window.addEventListener("resize", this.scheduleRefresh, { passive: true });
    window.addEventListener("pointermove", this.look, { passive: true });
    document.addEventListener("visibilitychange", this.syncLoop);
    document.fonts.addEventListener("loadingdone", this.scheduleRefresh);
    canvas.addEventListener("webglcontextlost", this.contextLost);
    this.refresh();
    // The hero's entrance uses Framer transforms; remeasure after it settles.
    this.settleTimer = setTimeout(this.refresh, 1100);
    this.syncLoop();
  }

  private look = (event: PointerEvent) => {
    this.motion.lookX = event.clientX;
    this.motion.lookY = event.clientY;
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
    const surfaces: Ledge[] = [];
    this.hero
      .querySelectorAll<HTMLElement>("[data-octocat-surface]")
      .forEach((element) => {
        let rect = element.getBoundingClientRect();
        if (rect.width < 20 || rect.height === 0) return;
        // Stand on the visible top string, rather than the wrapper's empty padding.
        if (element.dataset.octocatSurface === "instrument") {
          const string = element.querySelector<SVGGraphicsElement>(
            "[data-mascot-string-index='0']",
          );
          const stringRect = string?.getBoundingClientRect();
          if (stringRect && stringRect.width > 20) rect = stringRect;
        }
        surfaces.push({
          id: element.dataset.octocatSurface!,
          x: rect.left,
          y: rect.top,
          width: rect.width,
          goal: element.hasAttribute("data-octocat-goal"),
        });
      });
    this.motion.setLayout(
      surfaces,
      window.innerWidth,
      window.innerHeight,
      window.scrollY,
    );
    this.callbacks.onLayout(surfaces);
    this.render();
  };

  private render(alpha = 1) {
    if (this.unavailable) return;
    const { x, y } = this.renderer.render(this.motion, alpha);
    this.hitTarget.style.transform = `translate3d(${x - 43}px,${y - 94}px,0)`;
    this.hitTarget.dataset.motion = this.motion.state;
    if (this.score !== this.motion.visited.size) {
      this.score = this.motion.visited.size;
      this.callbacks.onScore(Array.from(this.motion.visited));
    }
  }

  private syncLoop = () => {
    if (this.destroyed || this.unavailable) return;
    if (
      !document.hidden &&
      this.visible &&
      !this.paused &&
      (!this.motion.reducedMotion || this.motion.playing)
    )
      this.loop.start();
    else {
      this.loop.stop();
      this.render();
    }
  };

  setReducedMotion(reduced: boolean) {
    this.motion.reducedMotion = reduced;
    if (reduced && !this.motion.playing) {
      // Settle the rig once so the static pose is complete without idle motion.
      for (let i = 0; i < 90; i++) this.motion.update(1 / 120);
    }
    this.syncLoop();
  }

  play() {
    this.refresh();
    this.motion.play();
    this.paused = false;
    this.syncLoop();
  }

  restart() {
    this.motion.reset();
    this.paused = false;
    this.syncLoop();
    this.render();
  }

  stop() {
    this.motion.stop();
    this.paused = false;
    this.syncLoop();
    this.render();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.motion.clearInput();
    this.syncLoop();
  }

  destroy() {
    this.destroyed = true;
    this.loop.stop();
    clearTimeout(this.refreshTimer);
    clearTimeout(this.settleTimer);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    window.removeEventListener("scroll", this.scheduleRefresh);
    window.removeEventListener("resize", this.scheduleRefresh);
    window.removeEventListener("pointermove", this.look);
    document.removeEventListener("visibilitychange", this.syncLoop);
    document.fonts.removeEventListener("loadingdone", this.scheduleRefresh);
    this.canvas.removeEventListener("webglcontextlost", this.contextLost);
    this.renderer.destroy();
  }
}
