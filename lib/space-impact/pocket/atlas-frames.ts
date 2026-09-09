/**
 * Lost Signal: Pocket Edition — pure pixel raster builders.
 *
 * No DOM here: every sprite and frame is a deterministic palette-indexed
 * raster, so tests and the browser bake the exact same art.
 */
import type { Tone } from "./palette";

export interface Raster {
  w: number;
  h: number;
  data: Uint8Array;
}

export function raster(w: number, h: number): Raster {
  return { w, h, data: new Uint8Array(w * h) };
}
export function px(r: Raster, x: number, y: number, t: Tone): void {
  if (x >= 0 && y >= 0 && x < r.w && y < r.h) r.data[y * r.w + x] = t;
}
export function get(r: Raster, x: number, y: number): Tone {
  if (x < 0 || y < 0 || x >= r.w || y >= r.h) return 0;
  return r.data[y * r.w + x] as Tone;
}
export function rect(
  r: Raster,
  x: number,
  y: number,
  w: number,
  h: number,
  t: Tone,
): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) px(r, i, j, t);
}
/** Ordered 2×2 cluster between two tones. */
export function dither2(
  r: Raster,
  x: number,
  y: number,
  w: number,
  h: number,
  a: Tone,
  b: Tone,
  flip = false,
): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++)
      px(r, i, j, ((i + j) % 2 === 0) !== flip ? a : b);
}
/** Size-blocked ordered clusters: 2×2 or 4×4 tone cells. */
export function ditherBlock(
  r: Raster,
  x: number,
  y: number,
  w: number,
  h: number,
  a: Tone,
  b: Tone,
  size: 2 | 4,
  flip = false,
): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) {
      const cell = (Math.floor(i / size) + Math.floor(j / size)) % 2 === 0;
      px(r, i, j, cell !== flip ? a : b);
    }
}
/** 4×4 ordered clusters: rich shading with two tones. */
export function dither4(
  r: Raster,
  x: number,
  y: number,
  w: number,
  h: number,
  a: Tone,
  b: Tone,
): void {
  const map = [
    [0, 1, 0, 1],
    [1, 1, 1, 0],
    [0, 1, 0, 1],
    [1, 0, 1, 1],
  ];
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) px(r, i, j, map[j % 4][i % 4] ? a : b);
}
export function fillPoly(r: Raster, points: [number, number][], t: Tone): void {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of points) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if (y1 === y2) continue;
      if (y >= Math.min(y1, y2) && y < Math.max(y1, y2))
        xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.round(xs[k]); x <= Math.round(xs[k + 1]); x++)
        px(r, x, y, t);
  }
}
/** One-pixel contour around filled pixels (the sprite's ink outline). */
export function contour(r: Raster, t: Tone = 1): void {
  const src = Uint8Array.from(r.data);
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      if (!src[y * r.w + x]) continue;
      if (
        !get(r, x - 1, y) ||
        !get(r, x + 1, y) ||
        !get(r, x, y - 1) ||
        !get(r, x, y + 1)
      )
        r.data[y * r.w + x] = t;
    }
}
export function fromGrid(rows: string[], t?: Record<string, Tone>): Raster {
  const w = Math.max(...rows.map((row) => row.length));
  const r = raster(w, rows.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const tone = t?.[ch] ?? (Number(ch) as Tone);
      if (tone) px(r, x, y, tone);
    }
  });
  return r;
}
export function toGrid(r: Raster): string[] {
  const rows: string[] = [];
  for (let y = 0; y < r.h; y++) {
    let row = "";
    for (let x = 0; x < r.w; x++) row += String(r.data[y * r.w + x] || ".");
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Ship
// ---------------------------------------------------------------------------

const HULL: [number, number][] = [
  [6, 7],
  [8, 4],
  [15, 3],
  [23, 6],
  [15, 10],
  [8, 9],
];
const DORSAL: [number, number][] = [
  [8, 5],
  [10, 1],
  [12, 5],
];
const VENTRAL: [number, number][] = [
  [8, 9],
  [10, 13],
  [12, 9],
];

export function shipBody(bank: "level" | "up" | "down"): Raster {
  const r = raster(24, 14);
  fillPoly(r, HULL, 2);
  // Upper hull catches the light; the belly stays in shadow.
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++)
      if (get(r, x, y) === 2 && y < 6) px(r, x, y, 3);
  dither2(r, 9, 5, 7, 3, 3, 2);
  if (bank !== "down") fillPoly(r, DORSAL, 2);
  if (bank !== "up") fillPoly(r, VENTRAL, 2);
  contour(r);
  // Canopy: bright core marker with an ink rim and a faded glint.
  rect(r, 16, 5, 4, 3, 1);
  rect(r, 17, 5, 3, 2, 4);
  px(r, 17, 5, 3);
  // Engine slot.
  rect(r, 5, 5, 2, 4, 1);
  px(r, 6, 6, 2);
  return r;
}

export function shipFlame(base: Raster, frame: number): Raster {
  const r = raster(base.w + 6, base.h);
  const lengths = [3, 5, 4, 2];
  const len = lengths[frame % 4];
  for (let i = 0; i < len; i++) {
    const x = 5 - i;
    px(r, x, 6, i < 2 ? 4 : 3);
    if (i > 0 && i < len - 1) {
      px(r, x, 5, 3);
      px(r, x, 7, 3);
    }
  }
  px(r, 5 - len, 6, 3);
  for (let y = 0; y < base.h; y++)
    for (let x = 0; x < base.w; x++) {
      const t = get(base, x, y);
      if (t) px(r, x + 6, y, t);
    }
  return r;
}

const hashXY = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

export function shipBreakup(frame: number): Raster {
  // Staged fragmentation: 0-1 intact hull with impact sparks, 2-3 three
  // recognizable chunks rotating apart, 4-5 chunks scattering, 6-7 debris
  // field. The silhouette degrades gradually instead of vanishing.
  const base = shipBody("level");
  const r = raster(base.w + 12, base.h + 8);
  const cx = 14;
  const cy = 7;
  if (frame <= 1) {
    // Intact hull with a shock notch on the nose.
    for (let y = 0; y < base.h; y++)
      for (let x = 0; x < base.w; x++) {
        const t = get(base, x, y);
        if (t) px(r, x + 6, y + 4, t);
      }
    for (let i = 0; i < 5; i++) px(r, 26 + i, 9, i % 2 ? 4 : 3);
    if (frame === 1) {
      px(r, 24, 5, 4);
      px(r, 24, 11, 4);
      px(r, 25, 3, 4);
      px(r, 25, 13, 4);
    }
    return r;
  }
  const stage = frame - 1; // 1..6
  const spread = stage * 2.1;
  // Three chunk pivots: nose (E), wing (W), tail (N), rotating apart.
  const chunks: Array<[number, number, number]> = [
    [5, 1, stage * 0.45],
    [-4, 2, -stage * 0.38],
    [0, -4, stage * 0.3],
  ];
  for (let y = 0; y < base.h; y++)
    for (let x = 0; x < base.w; x++) {
      const t = get(base, x, y);
      if (!t) continue;
      const dx0 = x - cx;
      const dy0 = y - cy;
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < chunks.length; c++) {
        const [ox, oy] = chunks[c];
        const d = (dx0 - ox * 1.6) ** 2 + (dy0 - oy * 1.6) ** 2;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      const [ox, oy, rot] = chunks[best];
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const rx = Math.round(dx0 * cos - dy0 * sin + ox * stage + 6);
      const ry = Math.round(dx0 * sin + dy0 * cos + oy * stage + 4);
      px(r, rx, ry, t);
    }
  // Sparks lead the scatter front.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + frame;
    const rad = 3 + stage * 3.2;
    px(
      r,
      Math.round(cx + 6 + Math.cos(a) * rad),
      Math.round(cy + 4 + Math.sin(a) * rad * 0.7),
      i % 2 ? 4 : 3,
    );
  }
  return r;
}

// ---------------------------------------------------------------------------
// Enemy families (sector one: scout, sentry, diver)
// ---------------------------------------------------------------------------

export const SCOUT_A = fromGrid([
  "....1111....",
  "..11233211..",
  ".1233443321.",
  "123334433321",
  ".1233443321.",
  "..11233211..",
  "....1111....",
]);
export const SCOUT_B = fromGrid([
  "............",
  "...111111...",
  ".1233443321.",
  "123334433321",
  ".1233443321.",
  "...111111...",
  "............",
]);
export const SENTRY_BASE = fromGrid([
  "....11111....",
  "..112222211..",
  ".12233333221.",
  "1122334332211",
  "3112234432211",
  "3112234432211",
  ".12233333221.",
  "..112222211..",
  "....11111....",
]);
export const SENTRY_FIRE = fromGrid([
  "....11111....",
  "..112222211..",
  ".12233333221.",
  "1122334332211",
  "3112233322111",
  "3112233322111",
  ".12233333221.",
  "..112222211..",
  "....11111....",
]);
export const DIVER_A = fromGrid([
  "11........",
  "1331......",
  ".13321....",
  "..133321..",
  "...133421.",
  "..133321..",
  ".13321....",
  "1331......",
  "11........",
]);
export const DIVER_B = fromGrid([
  "..........",
  ".1331.....",
  "..13321...",
  "...133321.",
  "....13341.",
  "...133321.",
  "..13321...",
  ".1331.....",
  "..........",
]);

// ---------------------------------------------------------------------------
// The Watcher — wreck, awakened body, cannons
// ---------------------------------------------------------------------------

export function watcherBody(eye: "sealed" | "cracking" | "open"): Raster {
  const r = raster(56, 44);
  const hull: [number, number][] = [
    [2, 15],
    [10, 5],
    [28, 1],
    [46, 5],
    [54, 15],
    [54, 28],
    [46, 38],
    [28, 43],
    [10, 38],
    [2, 28],
  ];
  fillPoly(r, hull, 1);
  // Six hull plates, each with its own block-cluster density — no uniform tweed.
  ditherBlock(r, 4, 3, 22, 9, 2, 1, 4);
  ditherBlock(r, 28, 3, 24, 9, 2, 1, 2);
  rect(r, 4, 14, 15, 15, 2);
  dither2(r, 4, 14, 15, 7, 3, 2);
  ditherBlock(r, 21, 14, 14, 15, 2, 1, 2);
  ditherBlock(r, 37, 14, 15, 15, 3, 2, 2, true);
  ditherBlock(r, 4, 31, 22, 7, 2, 1, 4, true);
  ditherBlock(r, 28, 31, 24, 7, 2, 1, 2);
  // Mechanical seams with bolt studs.
  for (const y of [12, 30]) {
    for (let x = 6; x < 50; x++) px(r, x, y, 1);
    for (let x = 8; x < 50; x += 6) {
      px(r, x, y - 1, 1);
      px(r, x, y + 1, 1);
    }
  }
  for (const x of [19, 37])
    for (let y = 3; y < 41; y++) if (get(r, x, y)) px(r, x, y, 1);
  // Lit upper shell on the port plates only: asymmetric light.
  for (let x = 6; x < 26; x++)
    for (let y = 3; y < 11; y++)
      if (get(r, x, y) === 2 && (x + y) % 3 !== 0) px(r, x, y, 3);
  // A torn mandible bite and a sensor nub: the wreck has history.
  fillPoly(
    r,
    [
      [4, 40],
      [9, 33],
      [14, 38],
      [11, 43],
      [4, 43],
    ],
    0,
  );
  contour(r);
  rect(r, 9, 0, 4, 3, 2);
  contour(r);
  px(r, 10, 0, 3);
  // The eye: a framed socket the size of the hull's central plate.
  const cy = 21;
  for (let y = cy - 10; y <= cy + 10; y++)
    for (let x = 19; x <= 37; x++) {
      const d = Math.hypot(x - 28, (y - cy) * 1.12);
      if (d > 10) continue;
      if (eye === "sealed") {
        px(r, x, y, d > 8.6 ? 3 : d > 7.4 ? 2 : 1);
        if (Math.abs(y - cy) < 1 && d <= 7.4) px(r, x, y, 2);
      } else if (eye === "cracking") {
        if (d > 8.6) px(r, x, y, 3);
        else if (Math.abs(y - cy) > 4) px(r, x, y, 2);
        else px(r, x, y, d > 5.4 ? 3 : 4);
      } else {
        px(r, x, y, d > 8.6 ? 3 : d > 7 ? 2 : d > 4.4 ? 1 : 4);
      }
    }
  if (eye === "open") {
    rect(r, 27, 18, 3, 3, 1); // pupil
    rect(r, 31, 17, 2, 2, 3); // glint
    px(r, 24, 24, 3); // lower wet-light
  }
  return r;
}

export function watcherCannon(state: "held" | "extended" | "destroyed"): Raster {
  // Canvas 34×10, anchored on the pod: the barrel reaches 11 px past the
  // hull silhouette so extend/recoil reads at phone scale.
  const r = raster(34, 10);
  const pod = () => {
    rect(r, 23, 1, 9, 8, 2);
    dither2(r, 24, 2, 7, 6, 3, 2);
    contour(r);
    rect(r, 26, 4, 3, 3, 4);
    px(r, 26, 4, 1);
  };
  if (state === "destroyed") {
    pod();
    // Cracked housing, scorched stump where the barrel sheared off.
    rect(r, 16, 3, 7, 4, 1);
    px(r, 17, 2, 1);
    px(r, 18, 8, 1);
    px(r, 20, 4, 3);
    px(r, 27, 2, 1);
    px(r, 30, 7, 1);
    return r;
  }
  pod();
  if (state === "extended") {
    // Fully extended: long tube, lit top rail, ink muzzle collar.
    rect(r, 2, 3, 21, 4, 2);
    rect(r, 2, 3, 21, 1, 3);
    rect(r, 0, 2, 3, 6, 1);
    px(r, 0, 4, 4);
    px(r, 1, 4, 3);
  } else {
    // Retracted between attacks.
    rect(r, 6, 3, 17, 4, 2);
    rect(r, 6, 3, 17, 1, 3);
    rect(r, 4, 2, 3, 6, 1);
    px(r, 4, 4, 4);
    px(r, 5, 4, 3);
  }
  return r;
}

/** The Window That Blinked — wreck fragment with the breathing light. */
export const WINDOW_LIT = fromGrid([
  "11111111111111111111",
  "12221222221222112221",
  "12221222221222112221",
  "12221211111222112221",
  "12221214441244112221",
  "12221214441442112221",
  "12221211141222112221",
  "12221222221222112221",
  "12221222221222112221",
  "12221222212221112221",
  "12241222212221112221",
  "12221222221222112221",
  "11221122112211112211",
  "12221222221222112221",
]);
export const WINDOW_DIM = fromGrid([
  "11111111111111111111",
  "12221222221222112221",
  "12221222221222112221",
  "12221211111222112221",
  "12221213331233112221",
  "12221213331332112221",
  "12221211131222112221",
  "12221222221222112221",
  "12221222221222112221",
  "12221222212221112221",
  "12231222212221112221",
  "12221222221222112221",
  "11221122112211112211",
  "12221222221222112221",
]);

// ---------------------------------------------------------------------------
// Shots, pickups, HUD hearts
// ---------------------------------------------------------------------------

// Hostile shots: one solid body, darkest-ink core, lit center — never a
// fragmented shape that its own clearance or afterimage can imitate.
export const PULSE_SHOT = fromGrid(["4143", "4143"]);
export const ENEMY_SHOT = fromGrid(["1111", "1441", "1441", "1111"]);
export const ORB_SHOT = fromGrid(["11111", "12221", "12421", "12221", "11111"]);
export const SPLIT_SHOT = fromGrid(["44", "44"]);
export const RAIL_SHOT = fromGrid(["4444", "4444", "3333"]);

function pickup(glyph: (r: Raster) => void): Raster {
  const r = raster(11, 11);
  // Lit rim, ink edge, hollow interior: pickups never read as solid hazards.
  fillPoly(
    r,
    [
      [5, 0],
      [10, 5],
      [5, 10],
      [0, 5],
    ],
    3,
  );
  fillPoly(
    r,
    [
      [5, 1],
      [9, 5],
      [5, 9],
      [1, 5],
    ],
    1,
  );
  fillPoly(
    r,
    [
      [5, 3],
      [7, 5],
      [5, 7],
      [3, 5],
    ],
    0,
  );
  glyph(r);
  return r;
}

const G_PULSE = (r: Raster) => {
  px(r, 5, 4, 4);
  px(r, 4, 5, 4);
  px(r, 6, 5, 4);
  px(r, 5, 6, 4);
};
const G_SPLIT = (r: Raster) => {
  px(r, 5, 3, 4);
  px(r, 3, 7, 4);
  px(r, 7, 7, 4);
};
const G_RAIL = (r: Raster) => rect(r, 3, 5, 5, 1, 4);
const G_REPAIR = (r: Raster) => {
  rect(r, 4, 3, 3, 5, 4);
  rect(r, 3, 4, 5, 3, 4);
};
const G_CHARGE = (r: Raster) => {
  px(r, 6, 3, 4);
  px(r, 5, 4, 4);
  px(r, 4, 5, 4);
  px(r, 5, 5, 4);
  px(r, 6, 6, 4);
  px(r, 4, 7, 4);
};
const G_FEATHER = (r: Raster) => {
  px(r, 4, 3, 4);
  px(r, 5, 4, 4);
  px(r, 6, 5, 4);
  px(r, 5, 6, 4);
  px(r, 4, 7, 3);
};

export const pickupPulse = () => pickup(G_PULSE);
export const pickupSplit = () => pickup(G_SPLIT);
export const pickupRail = () => pickup(G_RAIL);
export const pickupRepair = () => pickup(G_REPAIR);
export const pickupCharge = () => pickup(G_CHARGE);
export const pickupFeather = () => pickup(G_FEATHER);

export const HEART_FULL = fromGrid([
  ".11.11.",
  "1444441",
  "1444441",
  ".14441.",
  "..141..",
  "...1...",
]);
export const HEART_EMPTY = fromGrid([
  ".33.33.",
  "3222223",
  "3222223",
  ".32223.",
  "..323..",
  "...3...",
]);

// ---------------------------------------------------------------------------
// Test-facing views over the same builders used by the baked atlas
// ---------------------------------------------------------------------------

export function shipFrames(bank: "level" | "up" | "down"): string[][] {
  const base = shipBody(bank);
  return [0, 1, 2, 3].map((frame) => toGrid(shipFlame(base, frame)));
}

export function getAtlasGrids(): Record<string, string[]> {
  return {
    "ship-idle-0": shipFrames("level")[0],
    "ship-idle-1": shipFrames("level")[1],
    "ship-idle-2": shipFrames("level")[2],
    "ship-idle-3": shipFrames("level")[3],
    "ship-up-0": shipFrames("up")[0],
    "ship-down-0": shipFrames("down")[0],
    "ship-breakup-0": toGrid(shipBreakup(0)),
    "ship-breakup-7": toGrid(shipBreakup(7)),
    scout: toGrid(SCOUT_A),
    "scout-flap": toGrid(SCOUT_B),
    sentry: toGrid(SENTRY_BASE),
    "sentry-fire": toGrid(SENTRY_FIRE),
    diver: toGrid(DIVER_A),
    "diver-tuck": toGrid(DIVER_B),
    "watcher-dormant": toGrid(watcherBody("sealed")),
    "watcher-cracking": toGrid(watcherBody("cracking")),
    "watcher-open": toGrid(watcherBody("open")),
    "cannon-held": toGrid(watcherCannon("held")),
    "cannon-extended": toGrid(watcherCannon("extended")),
    "cannon-destroyed": toGrid(watcherCannon("destroyed")),
    "window-lit": toGrid(WINDOW_LIT),
    "window-dim": toGrid(WINDOW_DIM),
    "shot-pulse": toGrid(PULSE_SHOT),
    "shot-enemy": toGrid(ENEMY_SHOT),
    "shot-orb": toGrid(ORB_SHOT),
    "pickup-pulse": toGrid(pickup(G_PULSE)),
    "heart-full": toGrid(HEART_FULL),
    "heart-empty": toGrid(HEART_EMPTY),
  };
}

export function rasterShape(): Record<string, number> {
  return {
    shipIdle: 4,
    shipUp: 4,
    shipDown: 4,
    shipBreakup: 8,
    scout: 2,
    sentry: 2,
    diver: 2,
    watcher: 3,
    cannon: 3,
  };
}
