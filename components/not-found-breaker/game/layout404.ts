/**
 * Compact bitmap glyphs for "404". Each cell is a brick when truthy.
 * Digits are 5 wide × 7 tall with one column of padding between them.
 */
const GLYPH_4 = [
  "10001",
  "10001",
  "10001",
  "11111",
  "00001",
  "00001",
  "00001",
];

const GLYPH_0 = [
  "01110",
  "10001",
  "10001",
  "10001",
  "10001",
  "10001",
  "01110",
];

const DIGITS = [GLYPH_4, GLYPH_0, GLYPH_4] as const;
const DIGIT_GAP = 1;

export interface BrickSpec {
  col: number;
  row: number;
  tier: 0 | 1 | 2;
}

export function build404BrickSpecs(): BrickSpec[] {
  const specs: BrickSpec[] = [];
  let colOffset = 0;

  for (let d = 0; d < DIGITS.length; d += 1) {
    const glyph = DIGITS[d];
    for (let row = 0; row < glyph.length; row += 1) {
      const line = glyph[row];
      for (let col = 0; col < line.length; col += 1) {
        if (line[col] !== "1") continue;
        const tier: 0 | 1 | 2 =
          row < 2 ? 2 : row < 5 ? 1 : 0;
        specs.push({ col: colOffset + col, row, tier });
      }
    }
    colOffset += glyph[0].length + DIGIT_GAP;
  }

  return specs;
}

export function count404Cells(): number {
  return build404BrickSpecs().length;
}

export interface LayoutMetrics {
  brickW: number;
  brickH: number;
  originX: number;
  originY: number;
  cols: number;
  rows: number;
}

export function layoutMetricsForCanvas(
  width: number,
  height: number,
): LayoutMetrics {
  const specs = build404BrickSpecs();
  let maxCol = 0;
  let maxRow = 0;
  for (const s of specs) {
    maxCol = Math.max(maxCol, s.col);
    maxRow = Math.max(maxRow, s.row);
  }
  const cols = maxCol + 1;
  const rows = maxRow + 1;

  const gap = 3;
  const maxFieldW = Math.min(width * 0.86, 720);
  const brickW = (maxFieldW - gap * (cols - 1)) / cols;
  const brickH = brickW * 0.55;
  const fieldW = cols * brickW + gap * (cols - 1);
  const originX = (width - fieldW) / 2;
  const originY = Math.max(72, height * 0.12);

  return { brickW, brickH, originX, originY, cols, rows };
}
