/**
 * Lost Signal: Pocket Edition — baked pixel atlas.
 *
 * Bakes the pure raster builders from `atlas-frames` into canvases together
 * with a one-pixel backlight clearance dilate used by the visibility
 * contract, and exposes the machine-readable manifest.
 */
import {
  DIVER_A,
  DIVER_B,
  HEART_EMPTY,
  HEART_FULL,
  PULSE_SHOT,
  ENEMY_SHOT,
  ORB_SHOT,
  RAIL_SHOT,
  SCOUT_A,
  SCOUT_B,
  SENTRY_BASE,
  SENTRY_FIRE,
  SPLIT_SHOT,
  WINDOW_DIM,
  WINDOW_LIT,
  pickupCharge,
  pickupFeather,
  pickupPulse,
  pickupRail,
  pickupRepair,
  pickupSplit,
  px,
  raster,
  shipBody,
  shipBreakup,
  shipFlame,
  watcherBody,
  watcherCannon,
  type Raster,
} from "./atlas-frames";
import {
  MINT_PALETTE,
  PHOSPHOR_PALETTE,
  POCKET_PALETTE,
  toneRGB,
  type ToneSet,
  type Tone,
} from "./palette";

export type PaletteName = "olive" | "mint";
export type AtlasPaletteName = PaletteName | "phosphor";

const TONES: Record<AtlasPaletteName, ToneSet> = {
  olive: { ...POCKET_PALETTE },
  mint: { ...MINT_PALETTE },
  phosphor: { ...PHOSPHOR_PALETTE },
};

export interface AtlasFrame {
  canvas: HTMLCanvasElement;
  /** Backlight-colored 1px dilation of the silhouette (clearance border). */
  clearance: HTMLCanvasElement;
  /** Blit center in canvas coordinates (hull center for animated ships). */
  anchor: { x: number; y: number };
}

export interface Atlas {
  shipIdle: AtlasFrame[];
  shipUp: AtlasFrame[];
  shipDown: AtlasFrame[];
  shipBreakup: AtlasFrame[];
  scout: AtlasFrame[];
  sentry: AtlasFrame[];
  diver: AtlasFrame[];
  watcherDormant: AtlasFrame;
  watcherCracking: AtlasFrame;
  watcherOpen: AtlasFrame;
  cannonHeld: AtlasFrame;
  cannonExtended: AtlasFrame;
  cannonDestroyed: AtlasFrame;
  windowLit: AtlasFrame;
  windowDim: AtlasFrame;
  pulseShot: AtlasFrame;
  enemyShot: AtlasFrame;
  orbShot: AtlasFrame;
  splitShot: AtlasFrame;
  railShot: AtlasFrame;
  pickupPulse: AtlasFrame;
  pickupSplit: AtlasFrame;
  pickupRail: AtlasFrame;
  pickupRepair: AtlasFrame;
  pickupCharge: AtlasFrame;
  pickupFeather: AtlasFrame;
  heartFull: AtlasFrame;
  heartEmpty: AtlasFrame;
  palette: ToneSet;
}

export interface AtlasEntry {
  id: string;
  frames: AtlasFrame[];
  w: number;
  h: number;
  anchor: { x: number; y: number };
  frameTicks: number;
  note: string;
}

function bake(
  r: Raster,
  tones: ToneSet,
  anchor?: { x: number; y: number },
): AtlasFrame {
  const canvas = document.createElement("canvas");
  canvas.width = r.w;
  canvas.height = r.h;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const image = ctx.createImageData(r.w, r.h);
    const colors = [
      null,
      toneRGB(tones[1]),
      toneRGB(tones[2]),
      toneRGB(tones[3]),
      toneRGB(tones[4]),
    ];
    for (let i = 0; i < r.w * r.h; i++) {
      const tone = r.data[i] as Tone;
      if (!tone) continue;
      const [red, green, blue] = colors[tone]!;
      image.data[i * 4] = red;
      image.data[i * 4 + 1] = green;
      image.data[i * 4 + 2] = blue;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }
  // Clearance: dilate every lit pixel by one art px, painted in backlight.
  const dilated = raster(r.w + 2, r.h + 2);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++)
      if (r.data[y * r.w + x])
        for (const [dx, dy] of [
          [0, 0],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          px(dilated, x + 1 + dx, y + 1 + dy, 4);
  const clearance = document.createElement("canvas");
  clearance.width = dilated.w;
  clearance.height = dilated.h;
  const cctx = clearance.getContext("2d");
  if (cctx) {
    cctx.fillStyle = tones[4];
    for (let y = 0; y < dilated.h; y++)
      for (let x = 0; x < dilated.w; x++)
        if (dilated.data[y * dilated.w + x]) cctx.fillRect(x, y, 1, 1);
  }
  return {
    canvas,
    clearance,
    anchor: anchor ?? { x: Math.floor(r.w / 2), y: Math.floor(r.h / 2) },
  };
}

const atlases = new Map<AtlasPaletteName, Atlas>();

export function getAtlas(name: AtlasPaletteName = "olive"): Atlas {
  const cached = atlases.get(name);
  if (cached) return cached;
  const t = TONES[name];
  const SHIP_ANCHOR = { x: 20, y: 7 };
  const CANNON_ANCHOR = { x: 27, y: 5 };
  const bakeAll = (
    frames: Raster[],
    anchor?: { x: number; y: number },
  ): AtlasFrame[] => frames.map((f) => bake(f, t, anchor));
  const atlas: Atlas = {
    shipIdle: bakeAll(
      [0, 1, 2, 3].map((f) => shipFlame(shipBody("level"), f)),
      SHIP_ANCHOR,
    ),
    shipUp: bakeAll(
      [0, 1, 2, 3].map((f) => shipFlame(shipBody("up"), f)),
      SHIP_ANCHOR,
    ),
    shipDown: bakeAll(
      [0, 1, 2, 3].map((f) => shipFlame(shipBody("down"), f)),
      SHIP_ANCHOR,
    ),
    shipBreakup: bakeAll(
      [0, 1, 2, 3, 4, 5, 6, 7].map(shipBreakup),
      SHIP_ANCHOR,
    ),
    scout: bakeAll([SCOUT_A, SCOUT_B]),
    sentry: bakeAll([SENTRY_BASE, SENTRY_FIRE]),
    diver: bakeAll([DIVER_A, DIVER_B]),
    watcherDormant: bake(watcherBody("sealed"), t),
    watcherCracking: bake(watcherBody("cracking"), t),
    watcherOpen: bake(watcherBody("open"), t),
    cannonHeld: bake(watcherCannon("held"), t, CANNON_ANCHOR),
    cannonExtended: bake(watcherCannon("extended"), t, CANNON_ANCHOR),
    cannonDestroyed: bake(watcherCannon("destroyed"), t, CANNON_ANCHOR),
    windowLit: bake(WINDOW_LIT, t),
    windowDim: bake(WINDOW_DIM, t),
    pulseShot: bake(PULSE_SHOT, t),
    enemyShot: bake(ENEMY_SHOT, t),
    orbShot: bake(ORB_SHOT, t),
    splitShot: bake(SPLIT_SHOT, t),
    railShot: bake(RAIL_SHOT, t),
    pickupPulse: bake(pickupPulse(), t),
    pickupSplit: bake(pickupSplit(), t),
    pickupRail: bake(pickupRail(), t),
    pickupRepair: bake(pickupRepair(), t),
    pickupCharge: bake(pickupCharge(), t),
    pickupFeather: bake(pickupFeather(), t),
    heartFull: bake(HEART_FULL, t),
    heartEmpty: bake(HEART_EMPTY, t),
    palette: t,
  };
  atlases.set(name, atlas);
  return atlas;
}

/** Machine-readable atlas manifest for docs and debug overlays. */
export function atlasManifest(name: PaletteName = "olive"): AtlasEntry[] {
  const a = getAtlas(name);
  const entry = (
    id: string,
    frames: AtlasFrame | AtlasFrame[],
    frameTicks: number,
    note: string,
  ): AtlasEntry => {
    const list = Array.isArray(frames) ? frames : [frames];
    return {
      id,
      frames: list,
      w: list[0].canvas.width,
      h: list[0].canvas.height,
      anchor: list[0].anchor,
      frameTicks,
      note,
    };
  };
  return [
    entry("ship-idle", a.shipIdle, 6, "4-frame engine cycle"),
    entry("ship-bank-up", a.shipUp, 6, "dorsal bank pose"),
    entry("ship-bank-down", a.shipDown, 6, "ventral bank pose"),
    entry("ship-breakup", a.shipBreakup, 5, "8-frame destruction"),
    entry("scout", a.scout, 14, "2-frame wing cycle"),
    entry("sentry", a.sentry, 16, "core blink + barrel"),
    entry("diver", a.diver, 10, "2-frame fin cycle"),
    entry("watcher-dormant", a.watcherDormant, 0, "sealed eye"),
    entry("watcher-cracking", a.watcherCracking, 0, "eye opening"),
    entry("watcher-open", a.watcherOpen, 0, "vulnerable iris"),
    entry("cannon-held", a.cannonHeld, 0, "retracted cannon"),
    entry("cannon-extended", a.cannonExtended, 0, "attack recoil"),
    entry("cannon-destroyed", a.cannonDestroyed, 0, "broken stub"),
    entry("window-lit", a.windowLit, 40, "blinking salvage clue"),
    entry("window-dim", a.windowDim, 40, "blinking salvage clue"),
    entry("shot-pulse", a.pulseShot, 0, "player pulse"),
    entry("shot-enemy", a.enemyShot, 0, "hostile shot"),
    entry("shot-orb", a.orbShot, 0, "heavy hostile shot"),
    entry("shot-split", a.splitShot, 0, "split pellet"),
    entry("shot-rail", a.railShot, 0, "rail lance"),
    entry("pickup", a.pickupPulse, 0, "outlined pickup diamond"),
    entry("heart-full", a.heartFull, 0, "HUD hull pip"),
    entry("heart-empty", a.heartEmpty, 0, "HUD lost pip"),
  ];
}
