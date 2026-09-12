import type { Pickup } from "../types";
import { raster, rect, px, fillPoly, type Raster } from "./atlas-frames";
const GLYPHS: Record<Pickup["kind"], number[]> = {
  pulse: [6, 5, 6, 4, 4],
  split: [7, 4, 7, 1, 7],
  rail: [6, 5, 6, 5, 5],
  seeker: [5, 7, 7, 5, 5],
  shield: [2, 5, 7, 5, 5],
  overdrive: [2, 5, 5, 5, 2],
  drone: [6, 5, 5, 5, 6],
  repair: [0, 2, 7, 2, 0],
  charge: [3, 2, 7, 2, 6],
  feather: [1, 3, 6, 2, 4],
  salvage: [2, 7, 2, 7, 2],
};
export function supplySprite(kind: Pickup["kind"]): Raster {
  const r = raster(13, 13);
  rect(r, 2, 0, 9, 13, 1);
  rect(r, 0, 2, 13, 9, 1);
  rect(r, 2, 1, 9, 11, 4);
  rect(r, 1, 2, 11, 9, 4);
  rect(r, 3, 2, 7, 1, 3);
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 3; x++)
      if (GLYPHS[kind][y] & (1 << (2 - x))) px(r, x + 5, y + 4, 1);
  return r;
}
export function combatEnemy(
  kind: "prism" | "armored" | "choir",
  frame: number,
): Raster {
  const r = raster(19, 17);
  if (kind === "prism") {
    fillPoly(
      r,
      [
        [9, 0],
        [16, 8],
        [9, 16],
        [2, 8],
      ],
      1,
    );
    fillPoly(
      r,
      [
        [9, 3],
        [13, 8],
        [9, 13],
        [5, 8],
      ],
      3,
    );
    rect(r, 7, 6, 4, 5, 4);
    px(r, 8 + frame, 8, 1);
  } else if (kind === "armored") {
    fillPoly(
      r,
      [
        [5, 1],
        [15, 1],
        [18, 5],
        [18, 11],
        [15, 15],
        [5, 15],
        [2, 12],
        [2, 4],
      ],
      1,
    );
    rect(r, 6, 3, 9, 11, 3);
    rect(r, 8, 5, 5, 7, 4);
    rect(r, 0, 4, 8, 2, 1);
    rect(r, 0, 11, 8, 2, 1);
    rect(r, 4, 7, frame ? 8 : 6, 3, 1);
    rect(r, 14, 5, 3, 7, 2);
  } else {
    fillPoly(
      r,
      [
        [3, 5],
        [12, 1 + frame],
        [18, 0],
        [15, 7],
        [18, 16],
        [11, 14 - frame],
        [3, 11],
        [0, 8],
      ],
      1,
    );
    fillPoly(
      r,
      [
        [4, 6],
        [13, 4],
        [11, 8],
        [14, 13],
        [4, 10],
      ],
      3,
    );
    rect(r, 4, 7, 6, 3, 4);
    px(r, 4, 8, 1);
  }
  return r;
}
