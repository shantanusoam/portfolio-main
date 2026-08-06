import type { FormationKind } from "./types";

export type FormationSlot = {
  formation: FormationKind;
  formationCenterX?: number;
  formationCenterY?: number;
  formationIndex: number;
  formationRadius?: number;
  homeY: number;
  phase: number;
  x: number;
};

const FORMATION_ROTATION: FormationKind[] = [
  "gridRanks",
  "staggeredColumns",
  "vFormation",
  "snake",
  "pincer",
  "spiralEntry",
  "gridRanks",
  "orbitRing",
];

export function pickFormationKind(waveInSector: number): FormationKind {
  return FORMATION_ROTATION[(waveInSector - 1) % FORMATION_ROTATION.length];
}

function slot(
  kind: FormationKind,
  x: number,
  homeY: number,
  phase: number,
  index: number,
): FormationSlot {
  return { formation: kind, formationIndex: index, homeY, phase, x };
}

const ROW_SPACING = 58;
const BASE_Y = 78;

export function buildFormation(
  kind: FormationKind,
  columns: number,
  rows: number,
  spacing: number,
  width: number,
): FormationSlot[] {
  const slots: FormationSlot[] = [];
  const startX = (width - spacing * (columns - 1)) / 2;

  if (kind === "vFormation") {
    const half = (columns - 1) / 2;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const armDepth = Math.abs(col - half);
        const x = width / 2 + (col - half) * spacing;
        const homeY = BASE_Y + row * ROW_SPACING + armDepth * 24;
        slots.push(slot(kind, x, homeY, row + col, slots.length));
      }
    }
    return slots;
  }

  if (kind === "pincer") {
    const total = columns * rows;
    for (let i = 0; i < total; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const depth = Math.floor(i / 2);
      const x = width / 2 + side * (70 + depth * spacing * 0.72);
      const homeY = BASE_Y + depth * ROW_SPACING * 0.88;
      slots.push(slot(kind, Math.min(width - 30, Math.max(30, x)), homeY, depth, i));
    }
    return slots;
  }

  if (kind === "staggeredColumns") {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const offset = row % 2 === 1 ? spacing / 2 : 0;
        const x = startX + col * spacing + offset;
        const homeY = BASE_Y + row * ROW_SPACING;
        slots.push(slot(kind, x, homeY, row + col, slots.length));
      }
    }
    return slots;
  }

  if (kind === "snake") {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const x = startX + col * spacing;
        const wave = Math.sin((col / Math.max(1, columns - 1)) * Math.PI * 2) * 34;
        const homeY = BASE_Y + row * ROW_SPACING + wave;
        slots.push(slot(kind, x, homeY, row + col, slots.length));
      }
    }
    return slots;
  }

  if (kind === "spiralEntry") {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const x = startX + col * spacing;
        const homeY = BASE_Y + row * ROW_SPACING;
        const entry = slot(kind, x, homeY, row + col, slots.length);
        entry.formationCenterX = width / 2;
        entry.formationCenterY = -60;
        entry.formationRadius = 50 + slots.length * 12;
        slots.push(entry);
      }
    }
    return slots;
  }

  if (kind === "orbitRing") {
    const total = Math.max(1, columns * rows);
    const centerX = width / 2;
    const centerY = 168;
    const radius = Math.min(width * 0.36, 46 + total * 13);
    for (let i = 0; i < total; i += 1) {
      const angle = (i / total) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const homeY = centerY + Math.sin(angle) * radius * 0.52;
      const entry = slot(kind, x, homeY, angle, i);
      entry.formationCenterX = centerX;
      entry.formationCenterY = centerY;
      entry.formationRadius = radius;
      slots.push(entry);
    }
    return slots;
  }

  if (kind === "convoy") {
    const total = columns * rows;
    const lineStartX = (width - spacing * (total - 1)) / 2;
    for (let i = 0; i < total; i += 1) {
      slots.push(slot(kind, lineStartX + i * spacing, BASE_Y + 26, i, i));
    }
    return slots;
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = startX + col * spacing;
      const homeY = BASE_Y + row * ROW_SPACING;
      slots.push(slot("gridRanks", x, homeY, row + col, slots.length));
    }
  }
  return slots;
}
