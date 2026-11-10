/**
 * Approved media for the "one living world" phase.
 *
 * Every entry points at a file that actually ships in `public/workshop/scenes`.
 * Nothing here is aspirational: if an entry exists, the video, its mobile cut,
 * its H.264 fallback and its poster have all been generated, reviewed and
 * measured. See `docs/connected-world-media.md` for the review record.
 *
 * Rules this file encodes (from the connected-world production direction):
 * - footage supplies the environment; code owns pointer response, collision,
 *   text, navigation and precise timing,
 * - ambient loops are locked-camera, first frame === last frame,
 * - one-shots are bridges, never looping backgrounds,
 * - the shared scene clock reads `phases`, it does not force video position
 *   every frame, so scroll and simulation stay independent of playback,
 * - reduced motion, still mode and data saving all resolve to the poster.
 */

export type MotionMode = "still" | "gentle" | "expressive";

export type SceneId =
  | "meadow"
  | "shore"
  | "dusk"
  | "greenhouse"
  | "resonance"
  | "dew-bridge"
  | "notebook"
  | "leaf";

export type SceneRole = "ambient" | "bridge" | "header";

/** Phase ids shared by code that listens to the scene clock. */
export type ScenePhaseId =
  | "rest"
  | "gather"
  | "crest"
  | "settle"
  | "hold"
  | "travel"
  | "cross"
  | "land"
  | "approach"
  | "contact"
  | "recover";

export type ScenePhase = {
  id: ScenePhaseId;
  /** Seconds from clip start. */
  start: number;
  end: number;
};

export type SceneSources = {
  /** VP9, 1080p, no audio. */
  webm: string;
  /** VP9, 540p, no audio. */
  mobileWebm: string;
  /** H.264 720p fallback, no audio, faststart. */
  mp4: string;
  poster: string;
};

export type SceneMedia = {
  id: SceneId;
  label: string;
  /** Where the scene sits in the world. */
  place: string;
  role: SceneRole;
  loop: boolean;
  /** Measured duration of the encoded clip, in seconds. */
  duration: number;
  intrinsic: { width: number; height: number };
  /** Approved still plate this clip was generated from. */
  plate: string;
  sources: SceneSources;
  /** Measured motion windows. Code may key cues to these, not to guesses. */
  phases: ScenePhase[];
  /** Direct routes that may show this scene. `*` matches one path segment. */
  routes: string[];
  /** Modes where the moving version is allowed. `still` always uses the poster. */
  modes: MotionMode[];
  /** What the page must still own in code even while the clip plays. */
  owns: string;
  measured: {
    /** Mean absolute luma difference between first and last frame (0-255). */
    seamDiff: number;
    /** Mean absolute luma difference between first and last frame brightness. */
    lumaDrift: number;
    /** Mean per-frame motion energy, one value per second of clip. */
    motionPerSecond: number[];
    /** Strongest measured motion, in seconds from clip start. */
    peakAt: number;
  };
};

const WIDTH = 1920;
const HEIGHT = 1080;

function sources(name: string): SceneSources {
  return {
    webm: `/workshop/scenes/${name}.webm`,
    mobileWebm: `/workshop/scenes/${name}-mobile.webm`,
    mp4: `/workshop/scenes/${name}.mp4`,
    poster: `/workshop/scenes/${name}-poster.webp`,
  };
}

/** The shared eight-second breath, expressed as measured phase windows. */
const AMBIENT_PHASES: ScenePhase[] = [
  { id: "rest", start: 0, end: 1 },
  { id: "gather", start: 1, end: 3 },
  { id: "crest", start: 3, end: 5 },
  { id: "settle", start: 5, end: 7 },
  { id: "rest", start: 7, end: 8 },
];

export const SCENES: Record<SceneId, SceneMedia> = {
  meadow: {
    id: "meadow",
    label: "The meadow listens",
    place: "Meadow — home",
    role: "ambient",
    loop: true,
    duration: 8.04,
    intrinsic: { width: WIDTH, height: HEIGHT },
    plate: "/workshop/meadow.webp",
    sources: sources("meadow"),
    phases: AMBIENT_PHASES,
    routes: ["/"],
    modes: ["gentle", "expressive"],
    owns: "Pointer light bend, seed flock, hero copy and navigation.",
    measured: {
      seamDiff: 1.59,
      lumaDrift: 0.43,
      motionPerSecond: [0.232, 0.373, 0.481, 0.731, 0.633, 0.31, 0.304, 0.343],
      peakAt: 5.29,
    },
  },
  shore: {
    id: "shore",
    label: "Water carries the same breath",
    place: "Shoreline — the pause between work and play",
    role: "ambient",
    loop: true,
    duration: 8.04,
    intrinsic: { width: 1280, height: 720 },
    plate: "/workshop/shore.webp",
    sources: sources("shore"),
    phases: AMBIENT_PHASES,
    routes: ["/"],
    modes: ["gentle", "expressive"],
    owns: "Pointer ripple overlay; the horse and bank never move in code.",
    measured: {
      seamDiff: 1.157,
      lumaDrift: 0.74,
      motionPerSecond: [0.201, 0.305, 0.58, 2.03, 3.207, 1.355, 0.209, 0.183],
      peakAt: 4.96,
    },
  },
  dusk: {
    id: "dusk",
    label: "Dusk holds the light",
    place: "Home — about and contact",
    role: "ambient",
    loop: true,
    duration: 8.04,
    intrinsic: { width: WIDTH, height: HEIGHT },
    plate: "/workshop/dusk.webp",
    sources: sources("dusk"),
    phases: AMBIENT_PHASES,
    routes: ["/"],
    modes: ["gentle", "expressive"],
    owns: "Contact glow; real contact text stays sharp and still.",
    measured: {
      seamDiff: 1.451,
      lumaDrift: 0.41,
      motionPerSecond: [0.435, 0.546, 0.572, 0.552, 0.533, 0.241, 0.179, 0.211],
      peakAt: 5.29,
    },
  },
  greenhouse: {
    id: "greenhouse",
    label: "A greenhouse for useful ideas",
    place: "Greenhouse — Systems",
    role: "ambient",
    loop: true,
    duration: 8.04,
    intrinsic: { width: WIDTH, height: HEIGHT },
    plate: "/workshop/plates/greenhouse.webp",
    sources: sources("greenhouse"),
    phases: [
      { id: "rest", start: 0, end: 1 },
      { id: "gather", start: 1, end: 3 },
      { id: "crest", start: 3, end: 5.2 },
      { id: "settle", start: 5.2, end: 7 },
      { id: "rest", start: 7, end: 8.04 },
    ],
    routes: ["/systems", "/systems/*"],
    modes: ["gentle", "expressive"],
    owns: "Registry index, tabs, live specimen and every readable label.",
    measured: {
      seamDiff: 1.544,
      lumaDrift: 0.04,
      motionPerSecond: [0.367, 0.42, 1.045, 1.66, 1.687, 0.9, 0.525, 0.72],
      peakAt: 4.46,
    },
  },
  resonance: {
    id: "resonance",
    label: "The resonance room",
    place: "Resonance room — Learning",
    role: "ambient",
    loop: true,
    duration: 8.04,
    intrinsic: { width: WIDTH, height: HEIGHT },
    plate: "/workshop/plates/resonance-room.webp",
    sources: sources("resonance"),
    phases: [
      { id: "rest", start: 0, end: 2 },
      { id: "gather", start: 2, end: 4.2 },
      { id: "crest", start: 4.2, end: 5.6 },
      { id: "settle", start: 5.6, end: 7 },
      { id: "rest", start: 7, end: 8.04 },
    ],
    routes: ["/learning"],
    modes: ["gentle", "expressive"],
    owns: "Track navigation, progress, the interactive strings and any sound.",
    measured: {
      seamDiff: 1.154,
      lumaDrift: 0.71,
      motionPerSecond: [0.069, 0.09, 0.117, 0.308, 0.326, 0.18, 0.058, 0.067],
      peakAt: 5.29,
    },
  },
  "dew-bridge": {
    id: "dew-bridge",
    label: "Through a drop of morning",
    place: "Meadow → greenhouse",
    role: "bridge",
    loop: false,
    duration: 8.04,
    intrinsic: { width: WIDTH, height: HEIGHT },
    plate: "/workshop/plates/dew-macro.webp",
    sources: sources("dew-bridge"),
    phases: [
      { id: "hold", start: 0, end: 1.6 },
      { id: "travel", start: 1.6, end: 3.2 },
      { id: "cross", start: 3.2, end: 4.8 },
      { id: "land", start: 4.8, end: 8.04 },
    ],
    routes: ["/systems", "/systems/*"],
    modes: ["expressive"],
    owns: "A real circular aperture, immediate navigation and a skip control.",
    measured: {
      seamDiff: 53.042,
      lumaDrift: 32.64,
      motionPerSecond: [
        0.673, 2.885, 3.424, 15.255, 9.236, 1.447, 0.601, 0.684,
      ],
      peakAt: 4.04,
    },
  },
  notebook: {
    id: "notebook",
    label: "A page catches the morning",
    place: "Field notebook — Blog",
    role: "header",
    loop: true,
    duration: 8.04,
    intrinsic: { width: WIDTH, height: HEIGHT },
    plate: "/workshop/plates/field-notebook-flat.webp",
    sources: sources("notebook"),
    phases: [
      { id: "rest", start: 0, end: 2 },
      { id: "gather", start: 2, end: 3.6 },
      { id: "crest", start: 3.6, end: 5.4 },
      { id: "settle", start: 5.4, end: 6.8 },
      { id: "rest", start: 6.8, end: 8.04 },
    ],
    routes: ["/blog", "/blog/*"],
    modes: ["gentle", "expressive"],
    owns: "Title continuity, reading column, selection, focus and back links.",
    measured: {
      seamDiff: 1.043,
      lumaDrift: 0.26,
      motionPerSecond: [0.046, 0.085, 0.154, 0.489, 1.162, 0.836, 0.286, 0.187],
      peakAt: 5,
    },
  },
  leaf: {
    id: "leaf",
    label: "The leaf becomes a world",
    place: "Home → Canopy",
    role: "bridge",
    loop: false,
    duration: 6.04,
    intrinsic: { width: WIDTH, height: HEIGHT },
    plate: "/workshop/plates/leaf-clearing.webp",
    sources: sources("leaf"),
    phases: [
      { id: "approach", start: 0, end: 1.4 },
      { id: "contact", start: 1.4, end: 2.6 },
      { id: "recover", start: 2.6, end: 4.2 },
      { id: "rest", start: 4.2, end: 6.04 },
    ],
    routes: ["/"],
    modes: ["expressive"],
    owns: "The procedural seedling, the real first platform and the game launch.",
    measured: {
      seamDiff: 48.506,
      lumaDrift: 11.63,
      motionPerSecond: [3.803, 6.256, 6.079, 3.18, 0.85, 0.247],
      peakAt: 1.46,
    },
  },
};

export const SCENE_ORDER: SceneId[] = [
  "meadow",
  "shore",
  "dusk",
  "greenhouse",
  "resonance",
  "dew-bridge",
  "notebook",
  "leaf",
];

/** Ambient scenes allowed in a given mode, in world order. */
export function scenesForMode(mode: MotionMode): SceneMedia[] {
  return SCENE_ORDER.map((id) => SCENES[id]).filter(
    (scene) => scene.loop && scene.modes.includes(mode),
  );
}

/**
 * Route → scene lookup. Exact routes win; `*` matches one segment.
 * Interactive labs intentionally return null so they keep their own input.
 */
export function sceneForRoute(pathname: string): SceneMedia | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  let match: SceneMedia | null = null;
  let specificity = -1;
  for (const id of SCENE_ORDER) {
    const scene = SCENES[id];
    for (const route of scene.routes) {
      const hit =
        route === clean ||
        (route.endsWith("/*") &&
          (clean === route.slice(0, -2) ||
            clean.startsWith(route.slice(0, -1))));
      if (!hit) continue;
      const score = route.includes("*") ? route.length - 1 : route.length;
      if (score > specificity) {
        specificity = score;
        match = scene;
      }
    }
  }
  return match;
}

/** Which phase of the scene clock is active at `time` seconds. */
export function phaseAt(scene: SceneMedia, time: number): ScenePhase | null {
  const t = Math.min(Math.max(time, 0), scene.duration);
  for (const phase of scene.phases) {
    if (t >= phase.start && t < phase.end) return phase;
  }
  return scene.phases.at(-1) ?? null;
}

export type PlaybackContext = {
  mode: MotionMode;
  reducedMotion: boolean;
  saveData?: boolean;
  visible?: boolean;
};

export type PlaybackReason =
  | "ok"
  | "reduced-motion"
  | "save-data"
  | "offscreen"
  | "still-mode"
  | "mode-disallowed";

export type PlaybackDecision = { play: boolean; reason: PlaybackReason };

/**
 * The single decision point for environmental playback. Pages must ask this
 * instead of starting video themselves, so motion preference, data saving,
 * visibility and mode rules can never drift apart.
 */
export function playbackFor(
  scene: SceneMedia,
  context: PlaybackContext,
): PlaybackDecision {
  if (context.reducedMotion) return { play: false, reason: "reduced-motion" };
  if (context.mode === "still") return { play: false, reason: "still-mode" };
  if (context.saveData) return { play: false, reason: "save-data" };
  if (context.visible === false) return { play: false, reason: "offscreen" };
  if (!scene.modes.includes(context.mode))
    return { play: false, reason: "mode-disallowed" };
  return { play: true, reason: "ok" };
}
