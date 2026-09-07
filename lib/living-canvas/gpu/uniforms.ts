import type { LivingFieldState, LivingFieldRect } from "../fieldRenderer";
import { DEFAULT_ANATOMY_SETTINGS, type AnatomyMode } from "../anatomy";

export const FIELD_VECTOR_NAMES = [
  "viewport",
  "pointer",
  "koi",
  "weather",
  "interaction",
  "command",
  "grid",
  "pulse0",
  "pulse1",
  "pulse2",
  "pulse3",
  "kinds",
  "hero0",
  "hero1",
  "hero2",
  "hero3",
  "node0",
  "node1",
  "node2",
  "tuning",
] as const;

export type FieldUniforms = Record<
  (typeof FIELD_VECTOR_NAMES)[number],
  Float32Array
>;

/** Allocate once; all rendering paths mutate these same vectors in place. */
export function createFieldUniforms(): FieldUniforms {
  const value = Object.fromEntries(
    FIELD_VECTOR_NAMES.map((key) => [key, new Float32Array(4)]),
  ) as FieldUniforms;
  value.viewport.set([2, 2, 0, 1 / 30]);
  value.koi.set([0.7, 0.35, 0, 0]);
  value.weather.set([0.4, 0, 0, 0.3]);
  value.grid.set([16, 12, 0, 0]);
  value.tuning.set([0.025, 1 / 0.62, 0.025, 1 / 2.8]);
  return value;
}

function bounded(value: number | undefined, fallback = 0, min = -1, max = 1) {
  return value !== undefined && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function copyRect(vector: Float32Array, rect: LivingFieldRect | undefined) {
  vector.fill(0);
  if (!rect) return;
  vector[0] = bounded(rect.left, 0, 0, 1);
  vector[1] = bounded(rect.top, 0, 0, 1);
  vector[2] = bounded(rect.right, 0, 0, 1);
  vector[3] = bounded(rect.bottom, 0, 0, 1);
}

const pulseNames = ["pulse0", "pulse1", "pulse2", "pulse3"] as const;
const kind = { string: 0.15, card: 0.45, control: 0.7, creature: 1 };
const anatomyMode: Record<AnatomyMode, number> = {
  composite: 0,
  velocity: 1,
  curl: 2,
  divergence: 3,
  pressure: 4,
  signal: 5,
  wake: 6,
  light: 7,
};

export function updateFieldUniforms(
  p: FieldUniforms,
  state: LivingFieldState,
  width: number,
  height: number,
) {
  p.viewport[0] = Math.max(1, width);
  p.viewport[1] = Math.max(1, height);
  p.viewport[2] = bounded(state.time, 0, 0, 1e9);
  const settings = state.anatomy ?? DEFAULT_ANATOMY_SETTINGS;
  p.viewport[3] = bounded(settings.speed, 1, 0.25, 1.5) / 30;
  p.grid[2] = anatomyMode[settings.mode] ?? 0;
  p.tuning[0] = bounded(settings.viscosity, 0.025, 0, 0.12);
  p.tuning[1] = bounded(settings.wakePersistence, 1 / 0.62, 0.5, 3);
  p.tuning[2] = bounded(settings.signalDiffusion, 0.025, 0, 0.12);
  p.tuning[3] = bounded(settings.lightPersistence, 1 / 2.8, 0.15, 0.7);
  p.pointer[0] = bounded(state.pointerX, 0.5, 0, 1);
  p.pointer[1] = bounded(state.pointerY, 0.5, 0, 1);
  p.pointer[2] = bounded(state.pointerVelocityX);
  p.pointer[3] = bounded(state.pointerVelocityY);
  p.koi[0] = bounded(state.creatureX, 0.5, 0, 1);
  p.koi[1] = bounded(state.creatureY, 0.5, 0, 1);
  p.koi[2] = bounded(state.velocityX);
  p.koi[3] = bounded(state.velocityY);
  p.weather[0] = bounded(state.zoneEnergy, 0.3, 0, 1);
  p.weather[1] = bounded(state.warmth);
  p.weather[2] = bounded(state.scrollVelocity);
  p.weather[3] = bounded(state.creatureIntent, 0, 0, 1);
  p.interaction[0] = bounded(state.commandFocus, 0, 0, 1);
  p.interaction[1] = bounded(state.xrayStrength, 0, 0, 1);
  p.interaction[2] = bounded(state.creatureTurn);
  p.interaction[3] = bounded(state.creaturePresence, 0, 0, 1);
  p.command[0] = bounded(state.commandCenterX, 0.5, 0, 1);
  p.command[1] = bounded(state.commandCenterY, 0.4, 0, 1);
  p.command[2] = bounded(state.commandRelease, 0, 0, 1);
  p.command[3] = bounded(state.heroVisibility, 0, 0, 1);
  p.kinds.fill(0);
  for (let i = 0; i < 4; i++) {
    const target = p[pulseNames[i]];
    target.fill(0);
    const pulse = state.pulses[Math.max(0, state.pulses.length - 4) + i];
    if (!pulse) continue;
    target[0] = bounded(pulse.x, 0, 0, 1);
    target[1] = bounded(pulse.y, 0, 0, 1);
    target[2] = bounded(pulse.age, 0, 0, 3);
    target[3] =
      bounded(pulse.intensity, 0, 0, 1) * (pulse.tone === "cool" ? -1 : 1);
    p.kinds[i] = kind[pulse.source] ?? 0.7;
  }
  copyRect(p.hero0, state.heroOccluders?.[0]);
  copyRect(p.hero1, state.heroOccluders?.[1]);
  copyRect(p.hero2, state.heroOccluders?.[2]);
  copyRect(p.hero3, state.heroOccluders?.[3]);
  copyRect(p.node0, state.xrayNodes?.[0]);
  copyRect(p.node1, state.xrayNodes?.[1]);
  copyRect(p.node2, state.xrayNodes?.[2]);
}
