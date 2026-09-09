/**
 * Lost Signal: Pocket Edition — Canvas2D presentation adapter.
 *
 * Render graph per frame:
 *   1. decay + refresh the scenery history buffer (LCD persistence)
 *   2. the Psyche layer (signal rot, burn-in memory, echo swarm) into history
 *   3. compose the art surface: backlight, history, protected critical layer
 *   4. upscale to the display backing buffer (nearest) + cell mask, glass
 *
 * Critical shapes (ship, hazards, shots, terrain, warnings, clues) are drawn
 * sharp after history with backlight clearance borders, so persistence and
 * the psyche layer can never imitate or hide a threat (plan §6).
 */
import type { Game, Input, Settings } from "../types";
import {
  ART_HEIGHT,
  ART_WIDTH,
  MINT_PALETTE,
  POCKET_PALETTE,
  PRESETS,
  TONE_RGB,
  type PresetName,
  type Tone,
} from "./palette";
import { computeFit, type FitResult } from "./fit";
import { getAtlas, type Atlas, type AtlasFrame } from "./atlas";
import {
  BurnIn,
  EchoSwarm,
  ExcitableRot,
  Microsaccade,
  eyeBlink,
  saccadicMask,
} from "./psyche";

export interface PocketPerf {
  fps: number;
  frameIntervals: number[];
  drawIntervals: number[];
  renderMs: number[];
  draws: number;
  lastFit: FitResult | null;
}

export interface PocketRenderer {
  resize(availableWidth: number, availableHeight: number, dpr: number): FitResult;
  render(
    game: Game,
    input: Input,
    settings: Settings,
    preset: PresetName,
    paletteName: "olive" | "mint",
    now: number,
  ): void;
  setPreset(preset: PresetName, paletteName: "olive" | "mint"): void;
  resetHistory(): void;
  dispose(): void;
  perf(): PocketPerf;
}

const RING = 240;

export function createPocketRenderer(
  display: HTMLCanvasElement,
): PocketRenderer {
  const atlas: Atlas = getAtlas("olive");
  const displayCtx = display.getContext("2d")!;

  const art = document.createElement("canvas");
  art.width = ART_WIDTH;
  art.height = ART_HEIGHT;
  let ctx = art.getContext("2d")!;

  const history = [makeSurface(), makeSurface()];
  let historyIndex = 0;
  let preset: PresetName = "pocket";
  let paletteName: "olive" | "mint" = "olive";
  let fit: FitResult | null = null;
  let lastPresent = 0;
  let lastDraw = -1000;
  let deathFrame = -1;
  let deathPos = { x: 0, y: 0 };
  let previousStatus = "ready";
  let previousRoom: Game["room"] = null;
  let transitionAge = -1;

  // --- the Psyche engine: living-glass cosmetics (§6-safe history layer) ---
  const rot = new ExcitableRot();
  const burn = new BurnIn();
  const swarm = new EchoSwarm();
  const saccade = new Microsaccade();
  let lastPsycheTick = 0;
  let rotDirty = true;
  // Offscreen buffers: one putImageData + one drawImage per system instead of
  // tens of thousands of fillRect calls per frame.
  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = rot.cols;
  rotCanvas.height = rot.rows;
  const rotCtx = rotCanvas.getContext("2d")!;
  const rotImage = rotCtx.createImageData(rot.cols, rot.rows);
  const burnCanvas = document.createElement("canvas");
  burnCanvas.width = burn.cols;
  burnCanvas.height = burn.rows;
  const burnCtx = burnCanvas.getContext("2d")!;
  const burnImage = burnCtx.createImageData(burn.cols, burn.rows);

  const backlight = makeSurface();
  const cellMask = makeSurface();
  const wear = makeSurface();

  const frameTimes: number[] = [];
  const drawTimes: number[] = [];
  const renderCosts: number[] = [];
  let previousFrame = 0;
  let totalDraws = 0;

  function makeSurface(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = ART_WIDTH;
    canvas.height = ART_HEIGHT;
    return canvas;
  }

  function rebuildStaticLayers(): void {
    const tone4 = TONE_RGB[4];
    const tone2 = TONE_RGB[2];
    const config = PRESETS[preset];
    // Static low-frequency backlight: lit center, subtly darker edges.
    const bctx = backlight.getContext("2d")!;
    bctx.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    bctx.fillStyle = `rgb(${tone4.join(",")})`;
    bctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT);
    const glow = document.createElement("canvas");
    glow.width = ART_WIDTH;
    glow.height = ART_HEIGHT;
    const gctx = glow.getContext("2d")!;
    const gradient = gctx.createRadialGradient(
      ART_WIDTH / 2,
      ART_HEIGHT / 2,
      8,
      ART_WIDTH / 2,
      ART_HEIGHT / 2,
      ART_WIDTH * 0.62,
    );
    const lift = Math.round((tone4[0] + 55) * config.backlight);
    gradient.addColorStop(0, `rgba(${lift},${lift + 22},${lift - 30},0.34)`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    gctx.fillStyle = gradient;
    gctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT);
    bctx.globalAlpha = 0.4 + config.backlight * 0.26;
    bctx.drawImage(glow, 0, 0);
    bctx.globalAlpha = 1;
    // Edge falloff: the glass frame swallows a little light.
    const edge = bctx.createLinearGradient(0, 0, 0, ART_HEIGHT);
    const dark = `rgba(${tone2.join(",")},1)`;
    edge.addColorStop(0, dark);
    edge.addColorStop(0.1, "rgba(0,0,0,0)");
    edge.addColorStop(0.9, "rgba(0,0,0,0)");
    edge.addColorStop(1, dark);
    bctx.globalAlpha = 0.2 * (0.4 + config.backlight);
    bctx.fillStyle = edge;
    bctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT);
    bctx.globalAlpha = 1;

    if (!fit) return;
    // Cell-gap mask aligned to the art grid at backing resolution.
    cellMask.width = fit.backingWidth;
    cellMask.height = fit.backingHeight;
    const cctx = cellMask.getContext("2d")!;
    cctx.clearRect(0, 0, cellMask.width, cellMask.height);
    const ink = `rgba(${TONE_RGB[1].join(",")},1)`;
    const stepX = fit.backingWidth / ART_WIDTH;
    const stepY = fit.backingHeight / ART_HEIGHT;
    cctx.fillStyle = ink;
    cctx.globalAlpha = config.cell;
    for (let cx = 0; cx < ART_WIDTH; cx++) {
      const left = Math.round(cx * stepX);
      const right = Math.round((cx + 1) * stepX);
      if (right - left >= 2) cctx.fillRect(right - 1, 0, 1, cellMask.height);
    }
    for (let cy = 0; cy < ART_HEIGHT; cy++) {
      const top = Math.round(cy * stepY);
      const bottom = Math.round((cy + 1) * stepY);
      if (bottom - top >= 2) cctx.fillRect(0, bottom - 1, cellMask.width, 1);
    }
    cctx.globalAlpha = 1;
    // Worn screen: static edge wear, never over the active playfield.
    wear.width = fit.backingWidth;
    wear.height = fit.backingHeight;
    const wctx = wear.getContext("2d")!;
    wctx.clearRect(0, 0, wear.width, wear.height);
    if (config.wear > 0) {
      wctx.fillStyle = ink;
      for (let i = 0; i < 90; i++) {
        const s = Math.sin(i * 12.9898) * 43758.5453;
        const t = Math.sin(i * 78.233) * 12345.6789;
        const fx = s - Math.floor(s);
        const fy = t - Math.floor(t);
        const edgeBand = fx < 0.14 || fx > 0.86 || fy < 0.12 || fy > 0.88;
        if (!edgeBand) continue;
        wctx.globalAlpha = config.wear * (0.16 + ((i * 37) % 20) / 90);
        wctx.fillRect(
          Math.floor(fx * wear.width),
          Math.floor(fy * wear.height),
          Math.max(1, Math.round(stepX / 2)),
          Math.max(1, Math.round(stepY / 2)),
        );
      }
      wctx.globalAlpha = 1;
    }
  }

  function toneAt(tone: Tone): string {
    const set = paletteName === "mint" ? MINT_PALETTE : POCKET_PALETTE;
    return set[tone as 1 | 2 | 3 | 4];
  }

  function blitFrame(
    frame: AtlasFrame,
    x: number,
    y: number,
    options: { alpha?: number; clearance?: number } = {},
  ): void {
    const alpha = options.alpha ?? 1;
    const border = options.clearance ?? 1;
    const left = Math.round(x - frame.anchor.x);
    const top = Math.round(y - frame.anchor.y);
    if (border > 0) {
      ctx.globalAlpha = alpha;
      const cl = left - 1;
      const ct = top - 1;
      for (let b = 0; b < border; b++)
        ctx.drawImage(frame.clearance, cl - b, ct - b);
    }
    ctx.globalAlpha = alpha;
    ctx.drawImage(frame.canvas, left, top);
    ctx.globalAlpha = 1;
  }

  /** Stepped pixel ring for pulses and warnings. */
  function ring(
    cx: number,
    cy: number,
    radius: number,
    tone: Tone,
    step = 3,
  ): void {
    const points = Math.max(14, Math.round(radius * 2.4));
    ctx.fillStyle = toneAt(tone);
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2;
      ctx.fillRect(
        Math.round(cx + Math.cos(a) * radius) - 1,
        Math.round(cy + Math.sin(a) * radius * 0.92) - 1,
        step - 1,
        step - 1,
      );
    }
  }

  // --- scenery (persistent history) ---------------------------------------

  function drawScenery(game: Game, settings: Settings): void {
    const drift = settings.reducedMotion ? 0 : game.tick / 60;
    // Sparse drifting specks, far plane — dim, never competing with hazards.
    ctx.fillStyle = toneAt(4);
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 16; i++) {
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      const y = Math.floor((seed - Math.floor(seed)) * (ART_HEIGHT - 24)) + 6;
      const x =
        ((((i * 149) % (ART_WIDTH + 12)) - drift * (2 + (i % 3))) %
          (ART_WIDTH + 12) +
          ART_WIDTH +
          12) %
          (ART_WIDTH + 12) -
        6;
      ctx.fillRect(Math.round(x), y, 1, 1);
    }
    ctx.globalAlpha = 1;
    // Scalloped horizon bands. Dark contact edge, lighter distant silhouettes.
    const bands = settings.lowEffects ? 1 : 2;
    for (let layer = 0; layer < bands; layer++) {
      const far = layer === 0;
      const baseY = far ? ART_HEIGHT - 14 : ART_HEIGHT - 7;
      const amp = far ? 9 : 5;
      const speed = far ? 6 : 11;
      const density = far ? 0.05 : 0.085;
      ctx.fillStyle = toneAt(far ? 3 : 2);
      for (let x = 0; x < ART_WIDTH; x++) {
        const t = (x + drift * speed) * density;
        const hump =
          Math.sin(t) * 0.5 +
          Math.sin(t * 2.17 + 1.3) * 0.3 +
          Math.sin(t * 4.31 + 2.1) * 0.2;
        const h = Math.max(1, Math.round(baseY + hump * amp));
        ctx.fillRect(x, h, 1, ART_HEIGHT - h);
      }
      ctx.fillStyle = toneAt(1);
      for (let x = 0; x < ART_WIDTH; x++) {
        const t = (x + drift * speed) * density;
        const hump =
          Math.sin(t) * 0.5 +
          Math.sin(t * 2.17 + 1.3) * 0.3 +
          Math.sin(t * 4.31 + 2.1) * 0.2;
        const h = Math.max(1, Math.round(baseY + hump * amp));
        if ((x + Math.round(drift * speed)) % 2 === 0) ctx.fillRect(x, h - 1, 1, 1);
      }
      if (game.sector % 2 === 1) {
        // Hanging silhouettes from the top on odd sectors.
        ctx.fillStyle = toneAt(far ? 3 : 2);
        for (let x = 0; x < ART_WIDTH; x++) {
          const t = (x + drift * speed * 1.3) * (density * 0.8);
          const dip = Math.sin(t + 0.7) * 0.5 + Math.sin(t * 2.71) * 0.5;
          const h = Math.max(0, Math.round(6 + dip * (far ? 6 : 3)));
          if (h > 0) ctx.fillRect(x, 0, 1, h);
        }
      }
    }
    // Cosmetic particles ride history, never the protected layer.
    if (!settings.lowEffects)
      for (const particle of game.particles) {
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = toneAt(particle.size > 2 ? 4 : 3);
        ctx.fillRect(
          Math.floor(particle.x / 2),
          Math.floor(particle.y / 2),
          Math.max(1, Math.round(particle.size / 2)),
          Math.max(1, Math.round(particle.size / 2)),
        );
      }
    ctx.globalAlpha = 1;
    if (game.room?.kind === "glitch") {
      ctx.fillStyle = toneAt(4);
      for (let i = 0; i < 6; i++)
        ctx.fillRect(
          ((i * 39 + Math.floor(game.tick / 12) * 13) % ART_WIDTH) | 0,
          i * 22,
          40,
          1,
        );
    }
    if (game.room?.kind === "observatory") drawObservatory();
  }

  function drawObservatory(): void {
    const cx = 168;
    const cy = 66;
    for (let y = -32; y <= 32; y++)
      for (let x = -32; x <= 32; x++) {
        const d = Math.hypot(x, y * 1.05);
        if (d > 32) continue;
        px2(x + cx, y + cy, d > 30 ? 1 : d > 24 ? ((x + y) % 4 ? 2 : 1) : (x + y) % 3 ? 3 : 4);
      }
    for (let y = -32; y <= 32; y++)
      for (let x = -32; x <= 32; x++)
        if (Math.hypot(x - 14, y * 1.05) < 22) px2(x + cx, y + cy, 1);
  }

  function px2(x: number, y: number, tone: Tone): void {
    if (x < 0 || y < 0 || x >= ART_WIDTH || y >= ART_HEIGHT) return;
    ctx.fillStyle = toneAt(tone);
    ctx.fillRect(x, y, 1, 1);
  }

  // --- the Psyche layer (history cosmetics) --------------------------------

  /**
   * The living glass: signal rot, burn-in memory, and the echo swarm.
   * Everything here is history-layer cosmetics — persistence smears it, the
   * critical layer composes above it, reduced-motion/low-effects disable it.
   * Cellular systems render through ImageData buffers: one drawImage each.
   */
  function drawPsyche(): void {
    if (rotDirty) {
      const data = rotImage.data;
      for (let i = 0; i < rot.cols * rot.rows; i++) {
        const level = rot.state[i];
        const o = i * 4;
        if (!level) {
          data[o + 3] = 0;
          continue;
        }
        // Freshly excited cells shimmer; refractory ones smolder.
        const [r, g, b] = level === 1 ? TONE_RGB[3] : TONE_RGB[2];
        data[o] = r;
        data[o + 1] = g;
        data[o + 2] = b;
        data[o + 3] = level === 1 ? 26 : 13;
      }
      rotCtx.putImageData(rotImage, 0, 0);
      rotDirty = false;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(rotCanvas, 0, 0, rot.cols * 2, rot.rows * 2);
    // Burn-in: the glass remembers where the flight has lived.
    const bd = burnImage.data;
    for (let i = 0; i < burn.cols * burn.rows; i++) {
      const level = burn.heat[i];
      const o = i * 4;
      if (level < 0.04) {
        bd[o + 3] = 0;
        continue;
      }
      const [r, g, b] = TONE_RGB[1];
      bd[o] = r;
      bd[o + 1] = g;
      bd[o + 2] = b;
      bd[o + 3] = Math.round(Math.min(1, level) * 38);
    }
    burnCtx.putImageData(burnImage, 0, 0);
    ctx.drawImage(burnCanvas, 0, 0, burn.cols * 2, burn.rows * 2);
    // The echo swarm: biological motion drifting through the sky band.
    ctx.fillStyle = toneAt(4);
    ctx.globalAlpha = 0.65;
    for (let i = 0; i < swarm.n; i++)
      ctx.fillRect(Math.round(swarm.x[i]), Math.round(swarm.y[i]), 1, 1);
    ctx.globalAlpha = 1;
  }

  /**
   * Marked safe corridors (plan §6): a vertical gap between collidable
   * terrain rects gets a lit veil — history suppressed beneath it — dotted
   * warning boundaries, and a lightened floor, so decorative ink or an
   * afterimage can never appear to bridge the passage.
   */
  function drawSafeCorridors(game: Game): void {
    const terrain = game.terrain;
    for (let a = 0; a < terrain.length; a++)
      for (let b = a + 1; b < terrain.length; b++) {
        let upper = terrain[a];
        let lower = terrain[b];
        if (upper.y > lower.y) [upper, lower] = [lower, upper];
        const x0 = Math.max(upper.x, lower.x);
        const x1 = Math.min(upper.x + upper.w, lower.x + lower.w);
        if (x1 - x0 < 16) continue;
        const gap0 = Math.round((upper.y + upper.h) / 2);
        const gap1 = Math.round(lower.y / 2);
        const height = gap1 - gap0;
        if (height < 9 || height > 66) continue;
        const bx = Math.round(x0 / 2);
        const bw = Math.round((x1 - x0) / 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = toneAt(4);
        ctx.fillRect(bx, gap0, bw, height);
        // Sparse static texture gives the lane identity even over a clean field.
        ctx.fillStyle = toneAt(3);
        ctx.globalAlpha = 0.4;
        for (let y = gap0 + 2; y < gap1 - 1; y += 4)
          for (let x = bx + 2; x < bx + bw - 1; x += 4)
            if (((x >> 2) + (y >> 2)) % 2 === 0) ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 1;
        ctx.fillStyle = toneAt(1);
        for (let dx = 0; dx < bw; dx += 4) {
          ctx.fillRect(bx + dx, gap0 - 2, 2, 2);
          ctx.fillRect(bx + dx, gap1, 2, 2);
        }
        ctx.fillStyle = toneAt(3);
        ctx.fillRect(bx + 1, gap0, Math.max(0, bw - 2), 1);
        ctx.fillRect(bx + 1, gap1 - 1, Math.max(0, bw - 2), 1);
      }
  }

  /** Terrain: collision-bearing ink with lit contact edge. */
  function drawTerrain(game: Game): void {
    for (const item of game.terrain) {
      const x = Math.round(item.x / 2);
      const y = Math.round(item.y / 2);
      const w = Math.round(item.w / 2);
      const h = Math.round(item.h / 2);
      if (w <= 0 || h <= 0) continue;
      ctx.fillStyle = toneAt(1);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = toneAt(2);
      for (let j = 0; j < h; j++)
        for (let i = j % 2; i < w; i += 2) ctx.fillRect(x + i, y + j, 1, 1);
      ctx.fillStyle = toneAt(1);
      ctx.fillRect(x, y, w, 1);
      ctx.fillRect(x, y + h - 1, w, 1);
      ctx.fillRect(x, y, 1, h);
      ctx.fillRect(x + w - 1, y, 1, h);
      ctx.fillStyle = toneAt(3);
      const litY = item.y === 0 ? y + h - 2 : y + 1;
      ctx.fillRect(x + 1, litY, Math.max(0, w - 2), 1);
    }
  }

  function drawCritical(game: Game, input: Input, settings: Settings): void {
    const highContrast = settings.highContrast;
    const border = highContrast ? 2 : PRESETS[preset].clearance;
    const half = (v: number) => v / 2;
    const shakeX =
      game.shake > 0 && !settings.reducedMotion
        ? Math.round(Math.sin(game.tick * 7) * game.shake)
        : 0;
    const shakeY =
      game.shake > 0 && !settings.reducedMotion
        ? Math.round(Math.cos(game.tick * 11) * game.shake * 0.4)
        : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawSafeCorridors(game);
    drawTerrain(game);

    // Interactable clues and features.
    for (const feature of game.features) {
      const x = Math.round(half(feature.x));
      const y = Math.round(half(feature.y));
      if (feature.kind === "window") {
        const lit = Math.floor(game.tick / 40) % 2 === 0;
        blitFrame(lit ? atlas.windowLit : atlas.windowDim, x, y, {
          clearance: border,
        });
      } else if (feature.kind === "planet") {
        ctx.fillStyle = toneAt(4);
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++)
            if (dx * dx + dy * dy <= 9) ctx.fillRect(x + dx, y + dy, 1, 1);
        ring(x, y, 7, 2, 2);
      } else if (feature.kind === "portal") {
        ring(x, y, 11, 3, 2);
        ring(x, y, 8, 2, 2);
        ctx.fillStyle = toneAt(4);
        ctx.fillRect(x - 1, y - 4, 2, 8);
      } else if (feature.kind === "ghost") {
        blitFrame(atlas.shipIdle[0], x, y, { alpha: 0.4, clearance: 0 });
        ring(x, y, 12, 2, 2);
      } else {
        // The probe asks for silence; its antenna lowers as trust grows.
        const lower = Math.round((feature.progress / 5) * 2);
        ctx.fillStyle = toneAt(1);
        ctx.fillRect(x - 4, y - 4, 8, 8);
        ctx.fillStyle = toneAt(2);
        ctx.fillRect(x - 3, y - 3, 6, 6);
        ctx.fillStyle = toneAt(4);
        ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = toneAt(3);
        ctx.fillRect(x - 1, y - 8 + lower, 2, 4);
        if (feature.progress > 0) {
          const arc = (feature.progress / 5) * 24;
          for (let i = 0; i < arc; i++) {
            const a = -Math.PI / 2 + (i / 24) * Math.PI * 2;
            ctx.fillRect(
              Math.round(x + Math.cos(a) * 9) - 1,
              Math.round(y + Math.sin(a) * 9) - 1,
              1,
              1,
            );
          }
        }
      }
    }

    // Pickups: outlined, never solid-core.
    for (const item of game.pickups) {
      const y = Math.round(half(item.y + Math.sin(item.age * 3) * 2));
      const frame =
        item.kind === "repair"
          ? atlas.pickupRepair
          : item.kind === "charge"
            ? atlas.pickupCharge
            : item.kind === "feather"
              ? atlas.pickupFeather
              : item.kind === "split"
                ? atlas.pickupSplit
                : item.kind === "rail"
                  ? atlas.pickupRail
                  : atlas.pickupPulse;
      blitFrame(frame, Math.round(half(item.x)), y, { clearance: border });
    }

    // Enemies.
    const cycle = (ticks: number) => Math.floor(game.tick / ticks) % 2;
    for (const enemy of game.enemies) {
      const x = Math.round(half(enemy.x));
      const y = Math.round(half(enemy.y));
      const frame =
        enemy.kind === "scout"
          ? atlas.scout[cycle(14)]
          : enemy.kind === "sentry"
            ? atlas.sentry[cycle(16)]
            : enemy.kind === "diver"
              ? atlas.diver[cycle(10)]
              : atlas.scout[cycle(14)];
      blitFrame(frame, x, y, { clearance: border });
      if (enemy.hp < enemy.maxHp) {
        ctx.fillStyle = toneAt(4);
        ctx.fillRect(x - 1, y - Math.floor(frame.canvas.height / 2) - 2, 2, 1);
      }
    }

    // The Watcher.
    if (game.boss && !game.bossDefeated) {
      const boss = game.boss;
      const x = Math.round(half(boss.x));
      const y = Math.round(half(boss.y));
      // Decorative tail plates trail behind the body: lighter, outlined,
      // never collidable, never near the player's safe lane.
      if (boss.awakened) {
        const sway = Math.sin(game.tick / 26) * 3;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = toneAt(3);
        ctx.fillRect(x + 30, y + sway - 3, 10, 7);
        ctx.fillRect(x + 41, y + sway * 1.6 - 2, 7, 5);
        ctx.fillStyle = toneAt(2);
        ctx.fillRect(x + 32, y + sway - 1, 6, 3);
        ctx.globalAlpha = 1;
      }
      const body =
        !boss.awakened
          ? atlas.watcherDormant
          : boss.transition > 0
            ? atlas.watcherCracking
            : atlas.watcherOpen;
      blitFrame(body, x, y, { clearance: border });
      for (const part of boss.parts) {
        const cxp = x - 7;
        const cyp = Math.round(y + half(part.y));
        const state =
          part.hp <= 0
            ? atlas.cannonDestroyed
            : boss.telegraph > 0 || boss.attackAge < 0.35
              ? atlas.cannonExtended
              : atlas.cannonHeld;
        blitFrame(state, cxp, cyp, { clearance: border });
        if (part.hp > 0) {
          ctx.fillStyle = toneAt(1);
          ctx.fillRect(
            cxp - 4,
            cyp + 5,
            Math.max(1, Math.round((9 * part.hp) / part.maxHp)),
            1,
          );
        }
      }
      // Telegraphed attack geometry: dotted line + lane band, always sharp.
      if (boss.telegraph > 0) {
        const ty = Math.round(half(boss.targetY));
        ctx.globalAlpha = 0.24;
        ctx.fillStyle = toneAt(1);
        ctx.fillRect(0, ty - 3, x - 15, 7);
        ctx.globalAlpha = 0.9;
        for (let dx = 0; dx < x - 16; dx += 4) ctx.fillRect(dx, ty, 2, 1);
        ctx.globalAlpha = 1;
        ring(x - 3, y, 9 + boss.telegraph * 5, 4, 2);
      }
      if (boss.awakened && boss.transition <= 0) {
        // The living eye: microsaccade jitter, reflexive blink, slow breath.
        if (!eyeBlink(game.tick)) {
          const breath = Math.round(Math.sin(game.tick / 40) + 1);
          const ex = x - 8 + saccade.offsetX;
          const ey = y - 1 + saccade.offsetY;
          ctx.fillStyle = toneAt(4);
          ctx.fillRect(ex, ey, 3 + breath, 3);
          ctx.fillStyle = toneAt(3);
          ctx.fillRect(ex + 3 + breath, ey + 1, 1, 1);
        }
      }
      if (boss.transition > 0)
        ring(x, y, half(36 + (1.2 - boss.transition) * 24), 3, 2);
    }

    // Shots. Hostile shots carry a two-art-pixel protected surround so
    // cosmetic remnants can never sit inside their clearance zone.
    for (const b of game.bullets) {
      if (b.dead) continue;
      const x = Math.round(half(b.x));
      const y = Math.round(half(b.y));
      if (b.enemy) {
        blitFrame(b.radius > 2 ? atlas.orbShot : atlas.enemyShot, x, y, {
          clearance: 2,
        });
      } else if (b.rail) {
        ctx.fillStyle = toneAt(3);
        ctx.fillRect(x - 11, y - 1, 11, 3);
        ctx.fillStyle = toneAt(4);
        ctx.fillRect(x - 2, y - 1, 3, 3);
      } else if (b.vx < -20 || b.vy !== 0) {
        blitFrame(atlas.splitShot, x, y, { clearance: 0 });
      } else {
        blitFrame(atlas.pulseShot, x, y, { clearance: 0 });
      }
    }

    // Player.
    const player = game.player;
    if (game.status !== "dead") {
      const bank =
        input.y < -0.3 || (input.target && input.target.y < player.y - 6)
          ? "up"
          : input.y > 0.3 || (input.target && input.target.y > player.y + 6)
            ? "down"
            : "level";
      const set =
        bank === "up"
          ? atlas.shipUp
          : bank === "down"
            ? atlas.shipDown
            : atlas.shipIdle;
      const frame = set[Math.floor(game.tick / 6) % set.length];
      const blink = player.invincible > 0 && game.tick % 12 < 5;
      blitFrame(frame, Math.round(half(player.x)), Math.round(half(player.y)), {
        alpha: blink ? 0.65 : 1,
        clearance: border,
      });
      if (highContrast) {
        ctx.fillStyle = toneAt(4);
        ctx.fillRect(Math.round(half(player.x)), Math.round(half(player.y)), 2, 2);
      }
      if (game.companion) {
        ctx.fillStyle = toneAt(3);
        ctx.fillRect(
          Math.round(half(player.x)) - 14,
          Math.round(half(player.y)) - 9 + Math.round(Math.sin(game.tick / 20) * 2),
          3,
          3,
        );
      }
      if (player.invincible > 0)
        ring(Math.round(half(player.x)), Math.round(half(player.y)), 8, 3, 2);
    } else if (deathFrame >= 0) {
      // Staged fragmentation from the chunk-preserving atlas: intact + shock,
      // chunks rotating apart, scatter, debris + sparks.
      const f = Math.min(7, Math.floor(deathFrame / 5));
      blitFrame(atlas.shipBreakup[f], deathPos.x, deathPos.y, { clearance: border });
    }

    // Ghost replay: deliberate, ring-distinguished from persistence.
    if (game.ghostPlayback > 0 && game.ghost?.points.length) {
      const index = Math.min(
        game.ghost.points.length - 1,
        Math.floor((12 - game.ghostPlayback) * 5),
      );
      const point = game.ghost.points[index];
      blitFrame(atlas.shipIdle[0], Math.round(half(point.x)), Math.round(half(point.y)), {
        alpha: 0.42,
        clearance: 0,
      });
    }

    // Phase Pulse: stepped concentric break in the ink.
    if (game.pulseTime > 0) {
      const radius = Math.max(2, Math.round((1 - game.pulseTime / 0.6) * 120));
      ring(Math.round(half(player.x)), Math.round(half(player.y)), radius, 4, 3);
      if (!settings.lowFlashes) {
        ctx.globalAlpha = Math.min(0.5, game.pulseTime / 6);
        ctx.fillStyle = toneAt(4);
        ctx.fillRect(-8, -8, ART_WIDTH + 16, ART_HEIGHT + 16);
        ctx.globalAlpha = 1;
      }
    }

    // Boss hull integrity bar, top-right of the playfield.
    if (game.boss && !game.bossDefeated && game.boss.awakened) {
      const w = 46;
      const x = ART_WIDTH - w - 6;
      ctx.fillStyle = toneAt(1);
      ctx.fillRect(x - 1, 5, w + 2, 5);
      ctx.fillStyle = toneAt(3);
      ctx.fillRect(
        x,
        6,
        Math.max(0, Math.round((w - 2) * (game.boss.hp / game.boss.maxHp))),
        3,
      );
    }

    ctx.restore();
  }

  // --- frame ---------------------------------------------------------------

  function render(
    game: Game,
    input: Input,
    settings: Settings,
    presetName: PresetName,
    palette: "olive" | "mint",
    now: number,
  ): void {
    if (presetName !== preset || palette !== paletteName) {
      preset = presetName;
      paletteName = palette;
      rebuildStaticLayers();
      resetHistory();
    }
    // One draw per presentation deadline; skip surplus rAF callbacks.
    if (now - lastDraw < 15.2) return;
    const started = performance.now();
    const elapsedPresent = Math.max(0, now - lastPresent);
    if (previousFrame) {
      frameTimes.push(now - previousFrame);
      if (frameTimes.length > RING) frameTimes.shift();
    }
    previousFrame = now;

    // Saccadic masking: one blank beat on room transitions.
    if (game.room !== previousRoom) {
      transitionAge = 0;
      previousRoom = game.room;
    } else if (transitionAge >= 0) transitionAge++;

    if (game.status !== previousStatus) {
      if (previousStatus !== "dead" && game.status === "dead") {
        deathFrame = 0;
        deathPos = { x: Math.round(game.player.x / 2), y: Math.round(game.player.y / 2) };
      }
      if (game.status === "running" || game.status === "ready") deathFrame = -1;
      previousStatus = game.status;
    }
    if (deathFrame >= 0)
      deathFrame = Math.min(
        48,
        deathFrame + Math.max(1, Math.round(elapsedPresent / 33.4)),
      );

    // Psyche engine advances on sim ticks (deterministic, skipped when frozen).
    if (game.tick !== lastPsycheTick) {
      const steps = Math.min(8, game.tick - lastPsycheTick);
      lastPsycheTick = game.tick;
      if (!settings.reducedMotion) {
        for (let i = 0; i < steps; i++) {
          const local = game.tick - i;
          if (local % 48 === 0 && !settings.lowEffects) {
            // Episodic seeds: waves bloom, cross the glass, and die out.
            let a = (Math.floor(local / 48) * 2654435761) >>> 0;
            for (let s = 0; s < 2; s++) {
              a |= 0;
              a = (a + 0x6d2b79f5) | 0;
              let t = Math.imul(a ^ (a >>> 15), 1 | a);
              t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
              rot.igniteAt(
                ((t ^ (t >>> 14)) >>> 0) % rot.cols,
                ((t ^ (t >>> 14)) >>> 0) % rot.rows,
              );
            }
          }
          if (local % 8 === 0 && !settings.lowEffects) {
            rot.step();
            rotDirty = true;
          }
          burn.decay();
          burn.splat(game.player.x / 2, game.player.y / 2, 0.015);
          if (game.boss) burn.splat(game.boss.x / 2, game.boss.y / 2, 0.008);
          swarm.step(game.player, game.tick);
        }
      }
      saccade.step(game.tick);
    }

    const config = PRESETS[preset];
    lastPresent = now;
    let decayed = 1;
    if (config.persistenceMs > 0 && elapsedPresent < 250)
      decayed = Math.exp(-elapsedPresent / config.persistenceMs);
    else if (config.persistenceMs === 0) decayed = 0;

    // 1. Refresh the persistence buffer: scenery + psyche cosmetics.
    const prev = history[historyIndex];
    const next = history[1 - historyIndex];
    const nctx = next.getContext("2d")!;
    nctx.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    if (decayed > 0.02) {
      nctx.globalAlpha = decayed;
      nctx.drawImage(prev, 0, 0);
      nctx.globalAlpha = 1;
    }
    ctx = next.getContext("2d")!;
    drawScenery(game, settings);
    if (!settings.reducedMotion) drawPsyche();
    historyIndex = 1 - historyIndex;

    // 2. Compose the art surface.
    ctx = art.getContext("2d")!;
    ctx.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    ctx.drawImage(backlight, 0, 0);
    // Saccadic masking: blank backlight beat on room transitions.
    if (!saccadicMask(transitionAge)) {
      ctx.drawImage(history[historyIndex], 0, 0);
      drawCritical(game, input, settings);
    }

    // 3. Present: nearest upscale, then static surface treatments.
    if (fit) {
      if (display.width !== fit.backingWidth || display.height !== fit.backingHeight) {
        display.width = fit.backingWidth;
        display.height = fit.backingHeight;
        display.style.width = `${fit.cssWidth}px`;
        display.style.height = `${fit.cssHeight}px`;
      }
      displayCtx.imageSmoothingEnabled = false;
      displayCtx.drawImage(art, 0, 0, fit.backingWidth, fit.backingHeight);
      displayCtx.drawImage(cellMask, 0, 0);
      if (PRESETS[preset].reflection > 0 && !settings.highContrast) {
        displayCtx.globalAlpha = PRESETS[preset].reflection;
        const streak = displayCtx.createLinearGradient(0, 0, display.width, display.height);
        streak.addColorStop(0, "rgba(255,255,255,0.5)");
        streak.addColorStop(0.12, "rgba(255,255,255,0)");
        displayCtx.fillStyle = streak;
        displayCtx.fillRect(0, 0, display.width, display.height * 0.7);
        displayCtx.globalAlpha = 1;
      }
      if (PRESETS[preset].wear > 0) displayCtx.drawImage(wear, 0, 0);
    }

    lastDraw = now;
    renderCosts.push(performance.now() - started);
    if (renderCosts.length > RING) renderCosts.shift();
    drawTimes.push(now);
    if (drawTimes.length > RING) drawTimes.shift();
    totalDraws++;
  }

  function resetHistory(): void {
    for (const buffer of history)
      buffer.getContext("2d")!.clearRect(0, 0, ART_WIDTH, ART_HEIGHT);
    historyIndex = 0;
    rot.state.fill(0);
    rotDirty = true;
    burn.heat.fill(0);
  }

  return {
    resize(availableWidth, availableHeight, dpr) {
      fit = computeFit(availableWidth, availableHeight, dpr);
      rebuildStaticLayers();
      resetHistory();
      lastPresent = 0;
      return fit;
    },
    render,
    setPreset(name, palette) {
      preset = name;
      paletteName = palette;
      rebuildStaticLayers();
      resetHistory();
    },
    resetHistory,
    dispose() {
      frameTimes.length = 0;
      drawTimes.length = 0;
      renderCosts.length = 0;
    },
    perf() {
      const recent = frameTimes.slice(-120);
      const fps =
        recent.length > 8
          ? 1000 / (recent.reduce((a, b) => a + b, 0) / recent.length)
          : 0;
      return {
        fps,
        frameIntervals: frameTimes.slice(),
        drawIntervals: drawTimes.slice(1).map((t, i) => t - drawTimes[i]),
        renderMs: renderCosts.slice(),
        draws: totalDraws,
        lastFit: fit,
      };
    },
  };
}
