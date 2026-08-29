export type SignalZoneKind = "moment" | "bridge" | "rest";
export type SignalZoneTone = "warm" | "neutral" | "cool";

export interface SignalZoneDataset {
  signalZone?: string;
  signalEnergy?: string;
  signalTone?: string;
}

export interface SignalZoneProfile {
  kind: SignalZoneKind;
  /** 0..1 visual amplitude before interaction impulses are applied. */
  energy: number;
  /** -1 cool, 0 neutral, +1 warm. */
  warmth: number;
}

export const DEFAULT_SIGNAL_ZONE_PROFILE: SignalZoneProfile = {
  kind: "bridge",
  energy: 0.36,
  warmth: 0,
};

const KIND_ENERGY: Record<SignalZoneKind, number> = {
  moment: 0.88,
  bridge: 0.42,
  rest: 0.14,
};

const TONE_WARMTH: Record<SignalZoneTone, number> = {
  warm: 0.72,
  neutral: 0,
  cool: -0.72,
};

function isSignalZoneKind(value: string | undefined): value is SignalZoneKind {
  return value === "moment" || value === "bridge" || value === "rest";
}

function isSignalZoneTone(value: string | undefined): value is SignalZoneTone {
  return value === "warm" || value === "neutral" || value === "cool";
}

export function clampSignalEnergy(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SIGNAL_ZONE_PROFILE.energy;
  return Math.min(1, Math.max(0.06, value));
}

/** Converts declarative DOM data attributes into a safe render profile. */
export function resolveSignalZoneProfile(
  dataset: SignalZoneDataset | undefined,
): SignalZoneProfile {
  if (!dataset) return { ...DEFAULT_SIGNAL_ZONE_PROFILE };

  const kind = isSignalZoneKind(dataset.signalZone)
    ? dataset.signalZone
    : DEFAULT_SIGNAL_ZONE_PROFILE.kind;
  const tone = isSignalZoneTone(dataset.signalTone)
    ? dataset.signalTone
    : "neutral";
  const parsedEnergy = Number(dataset.signalEnergy);

  return {
    kind,
    energy: dataset.signalEnergy
      ? clampSignalEnergy(parsedEnergy)
      : KIND_ENERGY[kind],
    warmth: TONE_WARMTH[tone],
  };
}

export function resolveCreatureIntent(behavior: string | undefined): number {
  switch (behavior) {
    case "sprint":
    case "scatter":
      return 1;
    case "follow":
    case "orbit":
      return 0.72;
    case "inspect":
    case "avoid":
      return 0.52;
    case "rest":
    case "dormant":
    case "reducedMotion":
      return 0.08;
    default:
      return 0.3;
  }
}
