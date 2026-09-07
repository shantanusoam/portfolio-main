export const ANATOMY_MODES = [
  {
    id: "composite",
    label: "Composite",
    note: "The final surface: a quiet atmosphere, transported signal, a fading wake and local light. This is the homepage's actual rendering path.",
  },
  {
    id: "velocity",
    label: "Velocity",
    note: "Where the current is going. The two stored velocity components become cool/warm channels; brighter areas move faster. Drag across the surface to push it.",
  },
  {
    id: "curl",
    label: "Curl",
    note: "Local rotation, read from the diagnostic buffer before pressure projection. Cool and warm distinguish opposite directions of rotation.",
  },
  {
    id: "divergence",
    label: "Divergence",
    note: "Local expansion and compression, measured before projection. The pressure pass uses this signed diagnostic to reduce unwanted sources and sinks.",
  },
  {
    id: "pressure",
    label: "Pressure",
    note: "The actual Jacobi pressure buffer. A few bounded iterations estimate the correction; subtracting its gradient makes the flow less compressible.",
  },
  {
    id: "signal",
    label: "Signal",
    note: "The transported signal channel. An impulse leaves a concentration that rides the current, diffuses and fades. It is memory, not a time-based background pattern.",
  },
  {
    id: "wake",
    label: "Wake",
    note: "The longer-lived memory channel written by the koi and deliberate impulses. Launch the probe, then watch its history outlast its movement.",
  },
  {
    id: "light",
    label: "Light",
    note: "Only the local string-light contribution, recomputed from the same presentation function. This is not a cached light texture or full radiance-cascade solver.",
  },
] as const;

export type AnatomyMode = (typeof ANATOMY_MODES)[number]["id"];
export interface LivingAnatomySettings {
  mode: AnatomyMode;
  speed: number;
  viscosity: number;
  wakePersistence: number;
  signalDiffusion: number;
  lightPersistence: number;
}

export const DEFAULT_ANATOMY_SETTINGS: LivingAnatomySettings = {
  mode: "composite",
  speed: 1,
  viscosity: 0.025,
  wakePersistence: 1 / 0.62,
  signalDiffusion: 0.025,
  lightPersistence: 1 / 2.8,
};
